'use client';

import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase/client';
import { subDays, addDays, isWithinInterval, parseISO, startOfDay, endOfDay, format, getYear, getISOWeek, getDay, differenceInDays } from 'date-fns';
import { it } from 'date-fns/locale';
import type {
  Hotel, Prenotazione, StagioneTariffaria, KPIData,
  TimeSeriesData, OccupancyDataPoint, CameraTypeDataPoint, PickupDataPoint, VisibleSeries,
} from './types';
import {
  getCorrespondingDateInPreviousYear, getTimeSeriesDateRange,
  calculateOccupancyOverlap, calculateCameraTypeData,
} from './utils';
import { SectionKPI } from './components/SectionKPI';
import { SectionGrafici } from './components/SectionGrafici';
import { SectionPickup } from './components/SectionPickup';

export default function StudioRevenuePage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loadingHotels, setLoadingHotels] = useState(true);

  const [selectedHotel, setSelectedHotel] = useState<string>('');
  const [showCancellazioni, setShowCancellazioni] = useState(false);
  const [applyTrigger, setApplyTrigger] = useState(0);

  const [prenotazioni, setPrenotazioni] = useState<Prenotazione[]>([]);
  const [loadingPrenotazioni, setLoadingPrenotazioni] = useState(false);
  const [stagioni, setStagioni] = useState<StagioneTariffaria[]>([]);

  const [showChart, setShowChart] = useState(false);
  const [showHistoricalSeries, setShowHistoricalSeries] = useState(false);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [openChartDialog, setOpenChartDialog] = useState(false);
  const [chartDialogDays, setChartDialogDays] = useState<number | null>(null);
  const [isCumulativeMode, setIsCumulativeMode] = useState(false);
  const [visibleSeries, setVisibleSeries] = useState<VisibleSeries>({
    anno_corrente: true,
    anno_meno_1: true,
    anno_meno_2: true,
    anno_meno_3: true,
  });

  const [showOccupancyChart, setShowOccupancyChart] = useState(false);
  const [occupancyData, setOccupancyData] = useState<OccupancyDataPoint[]>([]);
  const [snapshotDate, setSnapshotDate] = useState<string>('');
  const [visibleOccupancySeries, setVisibleOccupancySeries] = useState({
    anno_corrente: true,
    anno_meno_1: true,
    anno_meno_2: true,
    anno_meno_3: true,
  });
  const [kpiData, setKpiData] = useState<KPIData>({
    oggi: 0, oggi_anno_1: 0, oggi_anno_2: 0, oggi_anno_3: 0,
    ultimi7giorni: 0, ultimi7giorni_anno_1: 0, ultimi7giorni_anno_2: 0, ultimi7giorni_anno_3: 0,
    ultimi30giorni: 0, ultimi30giorni_anno_1: 0, ultimi30giorni_anno_2: 0, ultimi30giorni_anno_3: 0,
    totaleStazione: 0, totaleStazione_anno_1: 0, totaleStazione_anno_2: 0, totaleStazione_anno_3: 0,
  });

  const [openOccupancyDialog, setOpenOccupancyDialog] = useState(false);

  const [showCameraTypeChart, setShowCameraTypeChart] = useState(false);
  const [cameraTypeData, setCameraTypeData] = useState<CameraTypeDataPoint[]>([]);
  const [cameraTypeDataFiltered, setCameraTypeDataFiltered] = useState<CameraTypeDataPoint[]>([]);
  const [cameraTypes, setCameraTypes] = useState<Array<{ id: string; nome: string }>>([]);
  const [openCameraTypeDialog, setOpenCameraTypeDialog] = useState(false);
  const [visibleCameraTypes, setVisibleCameraTypes] = useState<{ [key: string]: boolean }>({});
  const [mainCameraTypeId, setMainCameraTypeId] = useState<string>('');
  const [mainGraphSlot, setMainGraphSlot] = useState<'main' | 0 | 1 | 2>('main');
  const [selectedAnno, setSelectedAnno] = useState<string>('');
  const [selectedStagione, setSelectedStagione] = useState<string>('');

  const [pickupDateFrom, setPickupDateFrom] = useState<string>('');
  const [pickupDateTo, setPickupDateTo] = useState<string>('');
  const [pickupSelectedTipologie, setPickupSelectedTipologie] = useState<string[]>([]);
  const [pickupAggrega, setPickupAggrega] = useState(true);
  const [pickupCrescitaGiorni, setPickupCrescitaGiorni] = useState<number>(14);
  const [pickupLoading, setPickupLoading] = useState(false);
  const [pickupOccupancyData, setPickupOccupancyData] = useState<PickupDataPoint[]>([]);
  const [pickupTipologieDisponibili, setPickupTipologieDisponibili] = useState<Array<{ nome: string; quantita: number }>>([]);
  const [showPickupChart, setShowPickupChart] = useState(false);
  const [pickupDropdownOpen, setPickupDropdownOpen] = useState(false);
  const [pickupCoefficiente, setPickupCoefficiente] = useState<number>(0);

  async function calcolaPickup() {
    if (!selectedHotel || !pickupDateFrom || !pickupDateTo || pickupSelectedTipologie.length === 0) return;

    setPickupLoading(true);
    setShowPickupChart(false);

    try {
      const { data: occupancyRaw, error: occError } = await supabase
        .from('occupancy_rate')
        .select('tipo_camera, data_occupazione, camere_occupate_giornaliere, camere_totali_tipo')
        .eq('id_hotel', selectedHotel)
        .gte('data_occupazione', pickupDateFrom)
        .lte('data_occupazione', pickupDateTo)
        .in('tipo_camera', pickupSelectedTipologie);

      if (occError) {
        console.error('[v0] Errore query occupancy_rate:', occError);
        setPickupLoading(false);
        return;
      }

      console.log('[v0] Occupancy raw data:', occupancyRaw?.length, 'righe');

      let totaleOccupateOggi = 0;
      let totaleCamereTipologie = 0;

      pickupSelectedTipologie.forEach(tipo => {
        const tipologia = pickupTipologieDisponibili.find(t => t.nome === tipo);
        if (tipologia) {
          totaleCamereTipologie += tipologia.quantita;
        }
      });

      const occupazionePerData = new Map<string, number>();
      (occupancyRaw || []).forEach(row => {
        const key = row.data_occupazione;
        occupazionePerData.set(key, (occupazionePerData.get(key) || 0) + row.camere_occupate_giornaliere);
      });

      const valoriOccupazione = Array.from(occupazionePerData.values());
      if (valoriOccupazione.length > 0) {
        totaleOccupateOggi = Math.round(valoriOccupazione.reduce((a, b) => a + b, 0) / valoriOccupazione.length);
      }

      console.log('[v0] Occupazione media attuale nel periodo:', totaleOccupateOggi, '/', totaleCamereTipologie);

      const oggi = new Date();
      const dataLimite = new Date();
      dataLimite.setDate(oggi.getDate() - pickupCrescitaGiorni);
      const dataLimiteStr = format(dataLimite, 'yyyy-MM-dd');
      const oggiStr = format(oggi, 'yyyy-MM-dd');

      const prenotazioniRilevanti = prenotazioni.filter(p => {
        if (!p.tipo_camera || !pickupSelectedTipologie.includes(p.tipo_camera)) return false;
        if (!p.arrivo || p.arrivo < pickupDateFrom || p.arrivo > pickupDateTo) return false;
        if (!p.data_prenotazione || p.data_prenotazione < dataLimiteStr || p.data_prenotazione > oggiStr) return false;
        if (p.stato_prenotazione === '4' || p.stato_prenotazione === '5') return false;
        return true;
      });

      console.log('[v0] Prenotazioni rilevanti per crescita (ultimi', pickupCrescitaGiorni, 'gg):', prenotazioniRilevanti.length);

      const velocitaCrescitaGiornaliera = prenotazioniRilevanti.length / pickupCrescitaGiorni;
      const velocitaCorretta = velocitaCrescitaGiornaliera * (1 + pickupCoefficiente / 100);

      console.log('[v0] Velocita crescita:', velocitaCrescitaGiornaliera.toFixed(2), 'pren/giorno, con coefficiente', pickupCoefficiente, '%:', velocitaCorretta.toFixed(2));

      const dataInizioSoggiorno = parseISO(pickupDateFrom);
      const dataFineSoggiorno = parseISO(pickupDateTo);

      const oggiScorsoAnno = new Date(oggi);
      oggiScorsoAnno.setFullYear(oggi.getFullYear() - 1);
      const diffDayOggi = getDay(oggi) - getDay(oggiScorsoAnno);
      oggiScorsoAnno.setDate(oggiScorsoAnno.getDate() + diffDayOggi);

      const inizioScorsoAnno = new Date(dataInizioSoggiorno);
      inizioScorsoAnno.setFullYear(dataInizioSoggiorno.getFullYear() - 1);
      const diffDayInizio = getDay(dataInizioSoggiorno) - getDay(inizioScorsoAnno);
      inizioScorsoAnno.setDate(inizioScorsoAnno.getDate() + diffDayInizio);

      const fineScorsoAnno = new Date(dataFineSoggiorno);
      fineScorsoAnno.setFullYear(dataFineSoggiorno.getFullYear() - 1);
      const diffDayFine = getDay(dataFineSoggiorno) - getDay(fineScorsoAnno);
      fineScorsoAnno.setDate(fineScorsoAnno.getDate() + diffDayFine);

      const inizioScorsoAnnoStr = format(inizioScorsoAnno, 'yyyy-MM-dd');
      const fineScorsoAnnoStr = format(fineScorsoAnno, 'yyyy-MM-dd');
      const oggiScorsoAnnoStr = format(oggiScorsoAnno, 'yyyy-MM-dd');

      console.log('[v0] Storico - oggi equivalente:', oggiScorsoAnnoStr, '| range soggiorno equivalente:', inizioScorsoAnnoStr, '->', fineScorsoAnnoStr);

      const prenotazioniStorico = prenotazioni.filter(p => {
        if (!p.tipo_camera || !pickupSelectedTipologie.includes(p.tipo_camera)) return false;
        if (!p.arrivo || p.arrivo < inizioScorsoAnnoStr || p.arrivo > fineScorsoAnnoStr) return false;
        if (p.stato_prenotazione === '4' || p.stato_prenotazione === '5') return false;
        return true;
      });

      console.log('[v0] Prenotazioni storico trovate:', prenotazioniStorico.length);
      prenotazioniStorico.forEach((p, idx) => {
        console.log(`[v0] Storico pren #${idx}: id=${p.id} | tipo_camera=${p.tipo_camera} | arrivo=${p.arrivo} | partenza=${p.partenza} | data_prenotazione=${p.data_prenotazione} | stato=${p.stato_prenotazione} | codice=${p.codice_prenotazione} | notti=${p.notti}`);
      });

      const giorniTotaliAsseX = differenceInDays(dataFineSoggiorno, oggi);

      const nottiRangeStorico: string[] = [];
      const notteCorrente = new Date(inizioScorsoAnno);
      while (notteCorrente < fineScorsoAnno) {
        nottiRangeStorico.push(format(notteCorrente, 'yyyy-MM-dd'));
        notteCorrente.setDate(notteCorrente.getDate() + 1);
      }
      const numNotti = nottiRangeStorico.length;

      console.log('[v0] Storico - notti nel range:', numNotti, '| da', nottiRangeStorico[0], 'a', nottiRangeStorico[numNotti - 1]);

      const storicoCumulativo = new Map<number, number>();

      for (let i = 0; i <= giorniTotaliAsseX; i++) {
        const dataEquivalente = addDays(oggiScorsoAnno, i);
        const dataEquivalenteStr = format(dataEquivalente, 'yyyy-MM-dd');

        const prenEntroData = prenotazioniStorico.filter(
          p => p.data_prenotazione && p.data_prenotazione <= dataEquivalenteStr
        );

        let sommaCamerePerNotte = 0;
        for (const notte of nottiRangeStorico) {
          const camereQuestaNotte = prenEntroData.filter(
            p => p.arrivo && p.partenza && p.arrivo <= notte && p.partenza > notte
          ).length;
          sommaCamerePerNotte += camereQuestaNotte;
        }

        const mediaOccupazione = numNotti > 0 ? Math.round(sommaCamerePerNotte / numNotti) : 0;
        storicoCumulativo.set(i, mediaOccupazione);
      }

      console.log('[v0] Storico cumulativo (overlap) - giorno 0:', storicoCumulativo.get(0), '| ultimo giorno:', storicoCumulativo.get(giorniTotaliAsseX));

      const chartData: PickupDataPoint[] = [];
      let giorniDaOggi = 0;
      const currentDate = new Date(oggi);

      while (currentDate <= dataFineSoggiorno) {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        const displayDate = format(currentDate, 'dd MMM', { locale: it });

        const proiezioneValore = Math.min(
          totaleCamereTipologie,
          Math.round(totaleOccupateOggi + (velocitaCorretta * giorniDaOggi))
        );

        const storicoValore = storicoCumulativo.get(giorniDaOggi) ?? null;

        chartData.push({
          date: dateStr,
          display_date: displayDate,
          occupate: totaleOccupateOggi,
          proiezione: proiezioneValore,
          totali: totaleCamereTipologie,
          percentuale_attuale: totaleCamereTipologie > 0 ? Math.round((totaleOccupateOggi / totaleCamereTipologie) * 100) : 0,
          percentuale_proiezione: totaleCamereTipologie > 0 ? Math.round((proiezioneValore / totaleCamereTipologie) * 100) : 0,
          storico: storicoValore,
        });

        currentDate.setDate(currentDate.getDate() + 1);
        giorniDaOggi++;
      }

      console.log('[v0] Chart data punti:', chartData.length);

      setPickupOccupancyData(chartData);
      setShowPickupChart(true);

    } catch (err) {
      console.error('[v0] Errore calcolo pickup:', err);
    } finally {
      setPickupLoading(false);
    }
  }

  useEffect(() => {
    async function fetchHotels() {
      try {
        const { data, error } = await supabase
          .from('hotel')
          .select('id, nome')
          .neq('nome', 'Tutti')
          .order('nome');

        if (error) throw error;

        setHotels(data || []);

        if (data && data.length > 0 && !selectedHotel) {
          setSelectedHotel(data[0].id);
        }
      } catch (err) {
        console.error('[v0] Errore nel caricamento degli hotel:', err);
      } finally {
        setLoadingHotels(false);
      }
    }

    fetchHotels();
  }, []);

  useEffect(() => {
    async function fetchTipologieCamere() {
      if (!selectedHotel) {
        setPickupTipologieDisponibili([]);
        return;
      }
      const { data, error } = await supabase
        .from('tipi_camere')
        .select('nome, quantità')
        .eq('id_hotel', selectedHotel)
        .eq('categoria', 'attivo');

      if (error) {
        console.error('[v0] Errore caricamento tipologie camere:', error);
        return;
      }

      const tipologie = (data || []).map(t => ({ nome: t.nome, quantita: t['quantità'] || 0 }));
      console.log('[v0] Tipologie camere caricate per hotel:', tipologie.length, tipologie.map(t => t.nome));
      setPickupTipologieDisponibili(tipologie);
      setPickupSelectedTipologie([]);
    }
    fetchTipologieCamere();
  }, [selectedHotel]);

  useEffect(() => {
    async function fetchAndCalculateKPI() {
      if (!selectedHotel) return;

      setLoadingPrenotazioni(true);
      try {
        const { data, error } = await supabase.rpc(
          'studiorevenue_recupera_prenotazioni_card',
          {
            p_hotel_id: selectedHotel,
            p_includi_cancellazioni: showCancellazioni,
          }
        ).limit(1000000);

        if (error) throw error;

        const fetchedPrenotazioni = data || [];
        console.log('[v0] selectedHotel:', selectedHotel, '| Prenotazioni caricate:', fetchedPrenotazioni.length);

        setPrenotazioni(fetchedPrenotazioni);

        const oggi = startOfDay(new Date());
        const sette_giorni_fa = startOfDay(subDays(new Date(), 7));
        const trenta_giorni_fa = startOfDay(subDays(new Date(), 30));

        const oggi_date = new Date();
        const mese_corrente = oggi_date.getMonth();
        const giorno_corrente = oggi_date.getDate();
        const anno_corrente = oggi_date.getFullYear();

        let stagione_inizio: Date;
        let stagione_fine: Date;

        if (mese_corrente < 8 || (mese_corrente === 8 && giorno_corrente < 15)) {
          stagione_inizio = startOfDay(new Date(anno_corrente, 4, 23));
          stagione_fine = endOfDay(new Date(anno_corrente, 8, 14));
        } else {
          stagione_inizio = startOfDay(new Date(anno_corrente + 1, 4, 23));
          stagione_fine = endOfDay(new Date(anno_corrente + 1, 8, 14));
        }

        let countOggi = 0, countOggi_anno_1 = 0, countOggi_anno_2 = 0, countOggi_anno_3 = 0;
        let countUltimi7 = 0, countUltimi7_anno_1 = 0, countUltimi7_anno_2 = 0, countUltimi7_anno_3 = 0;
        let countUltimi30 = 0, countUltimi30_anno_1 = 0, countUltimi30_anno_2 = 0, countUltimi30_anno_3 = 0;
        let countTotale = 0, countTotale_anno_1 = 0, countTotale_anno_2 = 0, countTotale_anno_3 = 0;

        const oggi_1anno_fa = getCorrespondingDateInPreviousYear(oggi, 1);
        const oggi_2anni_fa = getCorrespondingDateInPreviousYear(oggi, 2);
        const oggi_3anni_fa = getCorrespondingDateInPreviousYear(oggi, 3);

        const sette_giorni_fa_1anno = getCorrespondingDateInPreviousYear(sette_giorni_fa, 1);
        const sette_giorni_fa_2anni = getCorrespondingDateInPreviousYear(sette_giorni_fa, 2);
        const sette_giorni_fa_3anni = getCorrespondingDateInPreviousYear(sette_giorni_fa, 3);

        const trenta_giorni_fa_1anno = getCorrespondingDateInPreviousYear(trenta_giorni_fa, 1);
        const trenta_giorni_fa_2anni = getCorrespondingDateInPreviousYear(trenta_giorni_fa, 2);
        const trenta_giorni_fa_3anni = getCorrespondingDateInPreviousYear(trenta_giorni_fa, 3);

        const stagione_inizio_anno_1 = getCorrespondingDateInPreviousYear(stagione_inizio, 1);
        const stagione_fine_anno_1 = getCorrespondingDateInPreviousYear(stagione_fine, 1);
        const stagione_inizio_anno_2 = getCorrespondingDateInPreviousYear(stagione_inizio, 2);
        const stagione_fine_anno_2 = getCorrespondingDateInPreviousYear(stagione_fine, 2);
        const stagione_inizio_anno_3 = getCorrespondingDateInPreviousYear(stagione_inizio, 3);
        const stagione_fine_anno_3 = getCorrespondingDateInPreviousYear(stagione_fine, 3);

        fetchedPrenotazioni.forEach((p) => {
          if (!p.data_prenotazione) return;

          const dataPrenotazione = parseISO(p.data_prenotazione);

          if (p.arrivo) {
            const arrivoData = parseISO(p.arrivo);
            if (isWithinInterval(arrivoData, { start: stagione_inizio, end: stagione_fine })) countTotale++;
            if (isWithinInterval(arrivoData, { start: stagione_inizio_anno_1, end: stagione_fine_anno_1 })) countTotale_anno_1++;
            if (isWithinInterval(arrivoData, { start: stagione_inizio_anno_2, end: stagione_fine_anno_2 })) countTotale_anno_2++;
            if (isWithinInterval(arrivoData, { start: stagione_inizio_anno_3, end: stagione_fine_anno_3 })) countTotale_anno_3++;
          }

          if (isWithinInterval(dataPrenotazione, { start: oggi, end: endOfDay(oggi) })) countOggi++;
          if (isWithinInterval(dataPrenotazione, { start: oggi_1anno_fa, end: endOfDay(oggi_1anno_fa) })) countOggi_anno_1++;
          if (isWithinInterval(dataPrenotazione, { start: oggi_2anni_fa, end: endOfDay(oggi_2anni_fa) })) countOggi_anno_2++;
          if (isWithinInterval(dataPrenotazione, { start: oggi_3anni_fa, end: endOfDay(oggi_3anni_fa) })) countOggi_anno_3++;

          if (isWithinInterval(dataPrenotazione, { start: sette_giorni_fa, end: endOfDay(oggi) })) countUltimi7++;
          if (isWithinInterval(dataPrenotazione, { start: sette_giorni_fa_1anno, end: endOfDay(oggi_1anno_fa) })) countUltimi7_anno_1++;
          if (isWithinInterval(dataPrenotazione, { start: sette_giorni_fa_2anni, end: endOfDay(oggi_2anni_fa) })) countUltimi7_anno_2++;
          if (isWithinInterval(dataPrenotazione, { start: sette_giorni_fa_3anni, end: endOfDay(oggi_3anni_fa) })) countUltimi7_anno_3++;

          if (isWithinInterval(dataPrenotazione, { start: trenta_giorni_fa, end: endOfDay(oggi) })) countUltimi30++;
          if (isWithinInterval(dataPrenotazione, { start: trenta_giorni_fa_1anno, end: endOfDay(oggi_1anno_fa) })) countUltimi30_anno_1++;
          if (isWithinInterval(dataPrenotazione, { start: trenta_giorni_fa_2anni, end: endOfDay(oggi_2anni_fa) })) countUltimi30_anno_2++;
          if (isWithinInterval(dataPrenotazione, { start: trenta_giorni_fa_3anni, end: endOfDay(oggi_3anni_fa) })) countUltimi30_anno_3++;
        });

        setKpiData({
          oggi: countOggi, oggi_anno_1: countOggi_anno_1, oggi_anno_2: countOggi_anno_2, oggi_anno_3: countOggi_anno_3,
          ultimi7giorni: countUltimi7, ultimi7giorni_anno_1: countUltimi7_anno_1, ultimi7giorni_anno_2: countUltimi7_anno_2, ultimi7giorni_anno_3: countUltimi7_anno_3,
          ultimi30giorni: countUltimi30, ultimi30giorni_anno_1: countUltimi30_anno_1, ultimi30giorni_anno_2: countUltimi30_anno_2, ultimi30giorni_anno_3: countUltimi30_anno_3,
          totaleStazione: countTotale, totaleStazione_anno_1: countTotale_anno_1, totaleStazione_anno_2: countTotale_anno_2, totaleStazione_anno_3: countTotale_anno_3,
        });

        const { inizio: range_inizio, fine: range_fine } = getTimeSeriesDateRange();

        const timeSeriesMap = new Map<string, { anno_corrente: number; anno_meno_1: number; anno_meno_2: number; anno_meno_3: number; display_date: string }>();

        const annoOggi = getYear(oggi);

        fetchedPrenotazioni.forEach((p) => {
          if (!p.data_prenotazione) return;

          const dataArrivo = parseISO(p.arrivo);
          const annoArrivo = getYear(dataArrivo);
          const differenzaAnni = annoOggi - annoArrivo;

          if (differenzaAnni < 0 || differenzaAnni > 3) return;

          const meseArrivo = dataArrivo.getMonth() + 1;
          if (meseArrivo < 5 || meseArrivo > 9) return;

          const dataPrenotazione = parseISO(p.data_prenotazione);
          const mesoPrenot = dataPrenotazione.getMonth() + 1;
          const giornoPrenot = dataPrenotazione.getDate();
          const annoPrenot = getYear(dataPrenotazione);

          let annoStagione = annoPrenot;
          if (mesoPrenot > 9 || (mesoPrenot === 9 && giornoPrenot >= 15)) {
            annoStagione = annoPrenot + 1;
          }

          const dataInizioStagione = new Date(annoStagione - 1, 8, 15);
          const giorniDaInizio = Math.floor((dataPrenotazione.getTime() - dataInizioStagione.getTime()) / (1000 * 60 * 60 * 24));
          const settimanaIsoNormalizzata = Math.max(1, Math.ceil(giorniDaInizio / 7) + 1);

          if (!Number.isFinite(settimanaIsoNormalizzata)) return;

          const keyWeek = `W${String(settimanaIsoNormalizzata).padStart(2, '0')}`;

          const giorniDaInizioStagione = (settimanaIsoNormalizzata - 1) * 7;
          const dataInizioStagione2 = new Date(annoOggi - 1, 8, 15);
          const dataLeggibile = new Date(dataInizioStagione2.getTime() + giorniDaInizioStagione * 24 * 60 * 60 * 1000);
          const displayDate = format(dataLeggibile, 'MMM d', { locale: it });

          if (!timeSeriesMap.has(keyWeek)) {
            timeSeriesMap.set(keyWeek, { anno_corrente: 0, anno_meno_1: 0, anno_meno_2: 0, anno_meno_3: 0, display_date: displayDate });
          }

          const current = timeSeriesMap.get(keyWeek)!;
          if (differenzaAnni === 0) current.anno_corrente++;
          else if (differenzaAnni === 1) current.anno_meno_1++;
          else if (differenzaAnni === 2) current.anno_meno_2++;
          else if (differenzaAnni === 3) current.anno_meno_3++;
        });

        const seriesArray: TimeSeriesData[] = Array.from(timeSeriesMap.entries())
          .map(([week, values]) => ({
            week,
            display_date: values.display_date,
            anno_corrente: values.anno_corrente,
            anno_meno_1: values.anno_meno_1,
            anno_meno_2: values.anno_meno_2,
            anno_meno_3: values.anno_meno_3,
          }))
          .sort((a, b) => {
            const weekA = parseInt(a.week.replace('W', ''));
            const weekB = parseInt(b.week.replace('W', ''));
            return weekA - weekB;
          });

        setTimeSeriesData(seriesArray);

        const occupancyMap = calculateOccupancyOverlap(fetchedPrenotazioni, annoOggi, snapshotDate);

        const occupancyArray = Array.from(occupancyMap.entries())
          .map(([date, values]) => ({ date, ...values }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setOccupancyData(occupancyArray);

        const { data: stagioniRawData, error: stagioniError } = await supabase
          .rpc('studiorevenue_get_stagionitariffarie');

        if (stagioniError) {
          console.error('[v0] Errore nel caricamento stagioni tariffarie:', stagioniError);
          setStagioni([]);
        } else {
          setStagioni((stagioniRawData as StagioneTariffaria[]) || []);
          console.log('[v0] Stagioni tariffarie caricate:', stagioniRawData?.length);
        }

        const { data: cameraData, cameraTypes: types } = calculateCameraTypeData(fetchedPrenotazioni, annoOggi, stagioni);
        setCameraTypeData(cameraData);
        setCameraTypes(types.map(tipo => ({ id: tipo, nome: tipo })));

        const visibilityMap: { [key: string]: boolean } = {};
        types.forEach(tipo => { visibilityMap[tipo] = true; });
        setVisibleCameraTypes(visibilityMap);

        if (types.length > 0 && !mainCameraTypeId) {
          setMainCameraTypeId(types[0]);
        }
      } catch (err) {
        console.error('[v0] Errore nel caricamento delle prenotazioni:', err);
      } finally {
        setLoadingPrenotazioni(false);
      }
    }

    fetchAndCalculateKPI();
  }, [applyTrigger, snapshotDate]);

  useEffect(() => {
    if (prenotazioni.length === 0 || stagioni.length === 0) return;

    const annoOggi = new Date().getFullYear();

    const { data: cameraData } = calculateCameraTypeData(
      prenotazioni,
      annoOggi,
      stagioni,
      selectedStagione || undefined
    );

    setCameraTypeDataFiltered(cameraData);
    console.log('[v0] Dati filtrati per stagione:', selectedStagione, 'Punti dati:', cameraData.length);
  }, [selectedStagione, prenotazioni, stagioni]);

  return (
    <div className="min-h-screen bg-background p-6 space-y-8">
      {/* HEADER CON FILTRI */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Studio Revenue</h1>
        </div>

        <div className="flex flex-wrap gap-6 items-end rounded-lg border border-border bg-card p-6">
          <div className="flex flex-col gap-2 min-w-[200px]">
            <Label htmlFor="hotel-select" className="text-sm font-medium">
              Seleziona Hotel
            </Label>
            <Select value={selectedHotel} onValueChange={setSelectedHotel} disabled={loadingHotels}>
              <SelectTrigger id="hotel-select">
                <SelectValue placeholder={loadingHotels ? 'Caricamento...' : 'Scegli hotel...'} />
              </SelectTrigger>
              <SelectContent>
                {hotels.map((hotel) => (
                  <SelectItem key={hotel.id} value={hotel.id}>
                    {hotel.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="cancellations-toggle"
              checked={showCancellazioni}
              onCheckedChange={setShowCancellazioni}
            />
            <Label htmlFor="cancellations-toggle" className="text-sm font-medium cursor-pointer">
              Visualizza Cancellazioni
            </Label>
          </div>

          <button
            onClick={() => setApplyTrigger(prev => prev + 1)}
            disabled={loadingPrenotazioni}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingPrenotazioni ? 'Caricamento...' : 'Applica Filtri'}
          </button>
        </div>
      </div>

      <SectionKPI kpiData={kpiData} />

      <SectionGrafici
        showChart={showChart}
        setShowChart={setShowChart}
        showHistoricalSeries={showHistoricalSeries}
        setShowHistoricalSeries={setShowHistoricalSeries}
        timeSeriesData={timeSeriesData}
        openChartDialog={openChartDialog}
        setOpenChartDialog={setOpenChartDialog}
        chartDialogDays={chartDialogDays}
        setChartDialogDays={setChartDialogDays}
        isCumulativeMode={isCumulativeMode}
        setIsCumulativeMode={setIsCumulativeMode}
        visibleSeries={visibleSeries}
        setVisibleSeries={setVisibleSeries}
        showOccupancyChart={showOccupancyChart}
        setShowOccupancyChart={setShowOccupancyChart}
        occupancyData={occupancyData}
        snapshotDate={snapshotDate}
        setSnapshotDate={setSnapshotDate}
        visibleOccupancySeries={visibleOccupancySeries}
        setVisibleOccupancySeries={setVisibleOccupancySeries}
        openOccupancyDialog={openOccupancyDialog}
        setOpenOccupancyDialog={setOpenOccupancyDialog}
        showCameraTypeChart={showCameraTypeChart}
        setShowCameraTypeChart={setShowCameraTypeChart}
        cameraTypeData={cameraTypeData}
        cameraTypeDataFiltered={cameraTypeDataFiltered}
        cameraTypes={cameraTypes}
        openCameraTypeDialog={openCameraTypeDialog}
        setOpenCameraTypeDialog={setOpenCameraTypeDialog}
        visibleCameraTypes={visibleCameraTypes}
        setVisibleCameraTypes={setVisibleCameraTypes}
        mainGraphSlot={mainGraphSlot}
        setMainGraphSlot={setMainGraphSlot}
        selectedAnno={selectedAnno}
        setSelectedAnno={setSelectedAnno}
        selectedStagione={selectedStagione}
        setSelectedStagione={setSelectedStagione}
        stagioni={stagioni}
      />

      <SectionPickup
        selectedHotel={selectedHotel}
        pickupDateFrom={pickupDateFrom}
        setPickupDateFrom={setPickupDateFrom}
        pickupDateTo={pickupDateTo}
        setPickupDateTo={setPickupDateTo}
        pickupSelectedTipologie={pickupSelectedTipologie}
        setPickupSelectedTipologie={setPickupSelectedTipologie}
        pickupAggrega={pickupAggrega}
        setPickupAggrega={setPickupAggrega}
        pickupCrescitaGiorni={pickupCrescitaGiorni}
        setPickupCrescitaGiorni={setPickupCrescitaGiorni}
        pickupLoading={pickupLoading}
        pickupOccupancyData={pickupOccupancyData}
        pickupTipologieDisponibili={pickupTipologieDisponibili}
        showPickupChart={showPickupChart}
        pickupDropdownOpen={pickupDropdownOpen}
        setPickupDropdownOpen={setPickupDropdownOpen}
        pickupCoefficiente={pickupCoefficiente}
        setPickupCoefficiente={setPickupCoefficiente}
        calcolaPickup={calcolaPickup}
      />
    </div>
  );
}
