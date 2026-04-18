'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card } from '@/components/ui/card';
import type {
  CallData, KPIMetrics, HotelNumber, CodaDistribution, ConversionAnalysis,
  OperatoreStatistiche, CodaOperatore, SerieTemporaleOperatore, DistribuzioneOraria,
  OperatoreOutboundStatistiche, SerieTemporaleOutbound, ActiveTab,
} from './types';
import { TabRicevute } from './components/TabRicevute';
import { TabEffettuate } from './components/TabEffettuate';
import { TabOperatori } from './components/TabOperatori';
import { TabConversioni } from './components/TabConversioni';
import { TabConversioniArea } from './components/TabConversioniArea';

export default function CatiaPage() {
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [activeTab, setActiveTab] = useState<'ricevute' | 'effettuate' | 'operatori' | 'conversioni' | 'conversioni_area'>('ricevute');
  const [loading, setLoading] = useState(false);
  const [inboundData, setInboundData] = useState<CallData[]>([]);
  const [outboundData, setOutboundData] = useState<CallData[]>([]);
  const [inboundKPI, setInboundKPI] = useState<KPIMetrics | null>(null);
  const [outboundKPI, setOutboundKPI] = useState<KPIMetrics | null>(null);
  const [inboundTimeSeries, setInboundTimeSeries] = useState<Array<{ date: string; count: number }>>([]);
  const [inboundHeatmap, setInboundHeatmap] = useState<Array<{ ora: number; ANSWERED: number; 'NO ANSWER': number; BUSY: number }>>([]);
  const [showDetailedSeries, setShowDetailedSeries] = useState(false);
  const [inboundTimeSeriesDetailed, setInboundTimeSeriesDetailed] = useState<Array<{ date: string; ANSWERED: number; 'NO ANSWER': number; BUSY: number }>>([]);
  const [visibleSeries, setVisibleSeries] = useState({ ANSWERED: true, 'NO ANSWER': true, BUSY: true });
  const [visibleHeatmapSeries, setVisibleHeatmapSeries] = useState({ ANSWERED: true, 'NO ANSWER': true, BUSY: true });
  const [outboundTimeSeries, setOutboundTimeSeries] = useState<Array<{ date: string; count: number }>>([]);
  const [outboundTimeSeriesDetailed, setOutboundTimeSeriesDetailed] = useState<Array<{ date: string; ANSWERED: number; 'NO ANSWER': number; BUSY: number }>>([]);
  const [outboundHeatmap, setOutboundHeatmap] = useState<Array<{ ora: number; ANSWERED: number; 'NO ANSWER': number; BUSY: number }>>([]);
  const [showDetailedSeriesOutbound, setShowDetailedSeriesOutbound] = useState(false);
  const [visibleSeriesOutbound, setVisibleSeriesOutbound] = useState({ ANSWERED: true, 'NO ANSWER': true, BUSY: true });
  const [visibleHeatmapSeriesOutbound, setVisibleHeatmapSeriesOutbound] = useState({ ANSWERED: true, 'NO ANSWER': true, BUSY: true });
  const [hotelNumbers, setHotelNumbers] = useState<HotelNumber[]>([]);
  const [selectedHotelNumbers, setSelectedHotelNumbers] = useState<string[]>([]);
  const [loadingHotels, setLoadingHotels] = useState(false);
  const [inboundDataRaw, setInboundDataRaw] = useState<CallData[]>([]);
  const [codaDistribution, setCodaDistribution] = useState<CodaDistribution[]>([]);
  const [conversionAnalysis, setConversionAnalysis] = useState<ConversionAnalysis[]>([]);
  const [operatoriList, setOperatoriList] = useState<Array<{ id: bigint; nome: string; profilo: string }>>([]);
  const [selectedOperatore, setSelectedOperatore] = useState<string>('');
  const [selectedOperatoreNome, setSelectedOperatoreNome] = useState<string>('');
  const [loadingOperatore, setLoadingOperatore] = useState(false);
  const [operatoreStatistiche, setOperatoreStatistiche] = useState<OperatoreStatistiche | null>(null);
  const [operatoreCodaDistribution, setOperatoreCodaDistribution] = useState<CodaOperatore[]>([]);
  const [operatoreSerieTemporale, setOperatoreSerieTemporale] = useState<SerieTemporaleOperatore[]>([]);
  const [operatoreDistribuzioneOraria, setOperatoreDistribuzioneOraria] = useState<DistribuzioneOraria[]>([]);
  
  // States per EFFETTUATE operatori
  const [operatoriOutboundList, setOperatoriOutboundList] = useState<Array<{ profilo_senza_sigla: string; nome: string }>>([]);
  const [selectedOperatoreOutbound, setSelectedOperatoreOutbound] = useState<string>('');
  const [selectedOperatoreOutboundNome, setSelectedOperatoreOutboundNome] = useState<string>('');
  const [loadingOperatoreOutbound, setLoadingOperatoreOutbound] = useState(false);
  const [operatoreOutboundStatistiche, setOperatoreOutboundStatistiche] = useState<OperatoreOutboundStatistiche | null>(null);
  const [operatoreOutboundSerieTemporale, setOperatoreOutboundSerieTemporale] = useState<SerieTemporaleOutbound[]>([]);
  const [bestMaxChiamate, setBestMaxChiamate] = useState<{ nome: string; totale_chiamate: number } | null>(null);
  const [bestRapportoSuccesso, setBestRapportoSuccesso] = useState<{ nome: string; rapporto_successo: number } | null>(null);
  const [bestDurataTotale, setBestDurataTotale] = useState<{ nome: string; durata_totale_secondi: number } | null>(null);
  const [bestDurataMediaMin, setBestDurataMediaMin] = useState<{ nome: string; durata_media_secondi: number } | null>(null);
  const [bestDurataMediaMax, setBestDurataMediaMax] = useState<{ nome: string; durata_media_secondi: number } | null>(null);

  // States per CONVERSIONI tab
  const [selectedHotel, setSelectedHotel] = useState<string>('');
  const [hotelList, setHotelList] = useState<Array<{ id: string; nome: string }>>([]);
  const [conversioniPrenotazioniKPI, setConversioniPrenotazioniKPI] = useState<{ totale_prenotazioni: number; totale_fatturato: number; totale_notti: number } | null>(null);
  const [criterioAttribuzione, setCriterioAttribuzione] = useState<'primo-contatto' | 'durata-massima' | 'ogni-contatto'>('ogni-contatto');
  const [loadingConversioni, setLoadingConversioni] = useState(false);
  const [conversioniAgentiStats, setConversioniAgentiStats] = useState<Array<{
    agente_nome: string;
    agente_profilo_senza_sigla: string;
    totale_chiamate_agente: number;
    prenotazioni_convertite: number;
    tasso_conversione: number;
    fatturato_generato: number;
    giorni_media_cottura: number;
  }>>([]);
  
  // State per dati raw di prenotazioni e telefonate (per matching frontend)
  const [conversioniPrenotazioniRaw, setConversioniPrenotazioniRaw] = useState<any[]>([]);
  const [telefonate_automatico_raw, setTelefonate_automatico_raw] = useState<any[]>([]);
  const [conversioniPrenotazioniNoContact, setConversioniPrenotazioniNoContact] = useState(0);
  
  // State per ordinamento tabella agenti
  const [sortColumn, setSortColumn] = useState<'chiamate' | 'prenotazioni' | 'tasso' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // State per dialog dettagli prenotazione
  const [selectedPrenotazioneDetails, setSelectedPrenotazioneDetails] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  
  // State per dialog informazioni sistema
  const [showInfoDialog, setShowInfoDialog] = useState(false);

  // States per CONVERSIONI AREA tab
  const [conversioniAreaData, setConversioniAreaData] = useState<Array<{
    area_id: string;
    nome_area: string;
    totale_chiamate: number;
    totale_chiamate_risposte: number;
    totale_chiamate_che_hanno_portato_a_conversione: number;
    conversion_rate: number;
  }>>([]);
  const [loadingConversioniArea, setLoadingConversioniArea] = useState(false);
  const [durataMinima, setDurataMinima] = useState<number>(0);
  const [modeConversioniArea, setModeConversioniArea] = useState<'all_calls' | 'answered_calls'>('all_calls');
  const [drilldownArea, setDrilldownArea] = useState<{ area_id: string; nome_area: string } | null>(null);
  const [drilldownData, setDrilldownData] = useState<Array<{
    prenotazione_id: string;
    hotel_nome: string;
    data_prenotazione: string;
    arrivo: string;
    telefono_normalizzato_matchato: string;
    tipo_chiamata: string;
    data_chiamata: string;
    ora_chiamata: string;
    durata_secondi: number;
    agente: string;
    esito: string;
  }>>([]);
  const [loadingDrilldown, setLoadingDrilldown] = useState(false);
  const [drilldownPage, setDrilldownPage] = useState(20);
  const [drilldownSort, setDrilldownSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'data_chiamata', dir: 'desc' });

  const supabase = createClient();

  // ===== USEEFFECT: Carica lista hotel all'avvio =====
  useEffect(() => {
    const fetchHotels = async () => {
      const { data, error } = await supabase
        .from('hotel')
        .select('id, nome')
        .order('nome', { ascending: true });
      
      if (error) {
        console.log('[v0] Errore caricamento hotel:', error);
      } else if (data) {
        setHotelList(data);
      }
    };

    fetchHotels();
  }, []);

  // ===== USEEFFECT: Popola KPI prenotazioni quando cambiano filtri =====
  useEffect(() => {
    const fetchPrenotazioniKPI = async () => {
      if (!dateRange.from || !dateRange.to) return;

      const { data, error } = await supabase.rpc('rpc_conversioni_catia_prenotazioni_kpi', {
        data_inizio: dateRange.from,
        data_fine: dateRange.to,
        id_hotel_filter: selectedHotel || null
      });

      if (error) {
        console.log('[v0] Errore KPI prenotazioni:', error);
      } else if (data && data.length > 0) {
        setConversioniPrenotazioniKPI(data[0]);
      }
      
      // Carica anche le prenotazioni raw per il matching
      const { data: prenotazioniRaw, error: prenotazioniError } = await supabase
        .from('prenotazioni')
        .select('*')
        .gte('data_prenotazione', dateRange.from)
        .lte('data_prenotazione', dateRange.to);
      
      if (prenotazioniError) {
        console.log('[v0] Errore caricamento prenotazioni raw:', prenotazioniError);
      } else if (prenotazioniRaw) {
        const filtered = selectedHotel 
          ? prenotazioniRaw.filter(p => p.id_hotel === selectedHotel)
          : prenotazioniRaw;
        setConversioniPrenotazioniRaw(filtered);
        console.log('[v0] Prenotazioni raw caricate:', filtered.length);
      }
    };

    fetchPrenotazioniKPI();
  }, [dateRange, selectedHotel]);

  // ===== HANDLER: Pulsante Ricerca - Matching prenotazioni ↔ telefonate =====
  const handleConversioniRicerca = async () => {
    console.log('[v0] handleConversioniRicerca chiamato');
    console.log('[v0] conversioniPrenotazioniRaw.length:', conversioniPrenotazioniRaw?.length);
    console.log('[v0] criterioAttribuzione:', criterioAttribuzione);

    if (!dateRange.from || !dateRange.to) {
      console.log('[v0] Date range incompleto');
      return;
    }

    if (!conversioniPrenotazioniRaw || conversioniPrenotazioniRaw.length === 0) {
      console.log('[v0] Nessuna prenotazione caricata');
      return;
    }

    setLoadingConversioni(true);

    try {
      // Carica tutte le telefonate automatico nel range usando RPC
      console.log('[v0] Caricando telefonate automatico via RPC...');
      
      // Calcola data inizio estesa: 7 giorni prima
      const dataInizioDate = new Date(dateRange.from);
      dataInizioDate.setDate(dataInizioDate.getDate() - 7);
      const dataInizioEstesa = dataInizioDate.toISOString().split('T')[0];
      
      console.log('[v0] Range telefonate esteso:', dataInizioEstesa, 'a', dateRange.to);
      
      const { data: telData, error: telError } = await supabase.rpc(
        'rpc_conversioni_catia_telefonate_automatico',
        {
          data_inizio: dataInizioEstesa,
          data_fine: dateRange.to
        }
      );

      console.log('[v0] telError:', telError);
      console.log('[v0] telData lunghezza:', telData?.length);

      if (telError) {
        console.log('[v0] Errore caricamento telefonate:', telError);
        setLoadingConversioni(false);
        return;
      }

      setTelefonate_automatico_raw(telData || []);
      console.log('[v0] Telefonate caricate:', telData?.length);

      console.log('[v0] telError:', telError);
      console.log('[v0] telData lunghezza:', telData?.length);

      if (telError) {
        console.log('[v0] Errore caricamento telefonate:', telError);
        setLoadingConversioni(false);
        return;
      }

      setTelefonate_automatico_raw(telData || []);
      console.log('[v0] Telefonate caricate:', telData?.length);

      // Funzione ausiliaria per estrarre solo cifre
      const extractNumbers = (tel: string | null | undefined): string => {
        if (!tel) return '';
        return tel.replace(/\D/g, '');
      };

      // Funzione per validare numero telefono
      const isValidPhoneNumber = (num: string): boolean => {
        return num.length >= 10;
      };

      // Counting prenotazioni senza contatti
      let noContactCount = 0;

      // Map per aggregare per agente
      const agentiMap = new Map<string, {
        totale_chiamate: number;
        prenotazioni_matches: Array<{
          data_prenotazione: string;
          totale_soggiorno: number;
          notti: number;
          giorni_differenza: number;
          durata_secondi: number;
        }>;
      }>();

      // Per ogni prenotazione, cerca matching
      conversioniPrenotazioniRaw.forEach((prenotazione) => {
        const telPrimario = extractNumbers(prenotazione.cliente_telefono);
        const telSecondario = extractNumbers(prenotazione.cliente_cellulare);

        // Se nessun numero disponibile, conta come no-contact
        if ((!telPrimario || !isValidPhoneNumber(telPrimario)) && 
            (!telSecondario || !isValidPhoneNumber(telSecondario))) {
          noContactCount++;
          return;
        }

        // Cerca matching in telefonate (usare telPrimario, fallback telSecondario)
        const telToMatch = (telPrimario && isValidPhoneNumber(telPrimario)) ? telPrimario : telSecondario;

        const matchingTelefonate = (telData || []).filter((tel) => {
          const telChiamante = extractNumbers(tel.Chiamante);
          return telChiamante === telToMatch;
        });

        if (matchingTelefonate.length === 0) {
          noContactCount++;
          return;
        }

        // Applica criterio di attribuzione
        let selectedTelefonate = matchingTelefonate;

        if (criterioAttribuzione === 'primo-contatto') {
          // Ordina per data, prendi la prima
          selectedTelefonate = [
            matchingTelefonate.sort((a, b) => 
              new Date(a['Data/Ora Inizio']).getTime() - new Date(b['Data/Ora Inizio']).getTime()
            )[0]
          ];
        } else if (criterioAttribuzione === 'durata-massima') {
          // Prendi la telefonata con durata massima
          const maxDurataIndex = matchingTelefonate.reduce((maxIdx, current, idx) => 
            (current['Durata (sec)'] > matchingTelefonate[maxIdx]['Durata (sec)']) ? idx : maxIdx, 0
          );
          selectedTelefonate = [matchingTelefonate[maxDurataIndex]];
        }
        // Per 'ogni-contatto', usa tutti i matchingTelefonate

        // Aggrega per agente
        selectedTelefonate.forEach((telefonata) => {
          const agente = telefonata.Agente || 'Sconosciuto';
          
          // Calcola differenza in giorni usando solo le date (senza orario)
          const prenotazioneDate = new Date(prenotazione.data_prenotazione).toISOString().split('T')[0];
          const telefontataDate = new Date(telefonata['Data/Ora Inizio']).toISOString().split('T')[0];
          const giorniDiff = Math.floor(
            (new Date(prenotazioneDate).getTime() - 
             new Date(telefontataDate).getTime()) / (1000 * 60 * 60 * 24)
          );

          // Scarta le telefonate successive alla prenotazione (non possono aver generato la conversione)
          if (giorniDiff < 0) {
            return;
          }

          if (!agentiMap.has(agente)) {
            agentiMap.set(agente, {
              totale_chiamate: 0,
              prenotazioni_matches: []
            });
          }

          const agentData = agentiMap.get(agente)!;
          agentData.prenotazioni_matches.push({
            data_prenotazione: prenotazione.data_prenotazione,
            totale_soggiorno: prenotazione.totale_soggiorno,
            notti: prenotazione.notti,
            giorni_differenza: giorniDiff,
            durata_secondi: telefonata['Durata (sec)'],
            cliente_email: prenotazione.cliente_email,
            tipo_camera: prenotazione.tipo_camera,
            data_telefonata: telefonata['Data/Ora Inizio']
          });
        });
      });

      // Contiamo le telefonate totali per agente
      (telData || []).forEach((tel) => {
        const agente = tel.Agente || 'Sconosciuto';
        if (agentiMap.has(agente)) {
          agentiMap.get(agente)!.totale_chiamate++;
        } else {
          agentiMap.set(agente, {
            totale_chiamate: 1,
            prenotazioni_matches: []
          });
        }
      });

      // Converti map in array e calcola stats
      const stats = Array.from(agentiMap.entries()).map(([agente, data]) => {
        const prenotazioni = data.prenotazioni_matches;
        const totale_convertite = prenotazioni.length;
        const tasso = (totale_convertite / data.totale_chiamate * 100) || 0;
        const fatturato = prenotazioni.reduce((sum, p) => sum + p.totale_soggiorno, 0);
        const giorni_medi = prenotazioni.length > 0 
          ? prenotazioni.reduce((sum, p) => sum + p.giorni_differenza, 0) / prenotazioni.length
          : 0;

        return {
          agente_nome: agente,
          agente_profilo_senza_sigla: agente,
          totale_chiamate_agente: data.totale_chiamate,
          prenotazioni_convertite: totale_convertite,
          tasso_conversione: tasso,
          fatturato_generato: fatturato,
          giorni_media_cottura: giorni_medi,
          prenotazioni_details: prenotazioni // Aggiunto: lista delle prenotazioni matchate
        };
      });

      // Ordina per prenotazioni convertite (descending)
      stats.sort((a, b) => b.prenotazioni_convertite - a.prenotazioni_convertite);

      setConversioniAgentiStats(stats);
      setConversioniPrenotazioniNoContact(noContactCount);

      console.log('[v0] Matching completato. Agenti:', stats.length, 'No contact:', noContactCount);
    } catch (e) {
      console.log('[v0] Exception matching:', e);
    } finally {
      setLoadingConversioni(false);
    }
  };

  // ===== HANDLER: Ordinamento tabella agenti =====
  const handleSort = (column: 'chiamate' | 'prenotazioni' | 'tasso') => {
    if (sortColumn === column) {
      // Cambia direzione se clicco la stessa colonna
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Nuova colonna, default descending
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  // ===== HANDLER: Sorting dei dati =====
  const getSortedStats = () => {
    if (!sortColumn) return conversioniAgentiStats;

    const sorted = [...conversioniAgentiStats];
    sorted.sort((a, b) => {
      let aVal, bVal;

      if (sortColumn === 'chiamate') {
        aVal = a.totale_chiamate_agente;
        bVal = b.totale_chiamate_agente;
      } else if (sortColumn === 'prenotazioni') {
        aVal = a.prenotazioni_convertite;
        bVal = b.prenotazioni_convertite;
      } else if (sortColumn === 'tasso') {
        aVal = a.tasso_conversione;
        bVal = b.tasso_conversione;
      }

      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return sorted;
  };

  // ===== HANDLER: Click su Prenotazioni Convertite per dettagli =====
  const handleShowDetails = (agente: any) => {
    setSelectedPrenotazioneDetails(agente);
    setShowDetailsDialog(true);
  };

  // ===== HANDLER: Ricerca Conversioni per Area =====
  const handleConversioniAreaRicerca = async () => {
    if (!dateRange.from || !dateRange.to) {
      return;
    }

    setLoadingConversioniArea(true);
    
    try {
      const { data, error } = await supabase.rpc('conversioni_area_get_breakdown', {
        p_date_from: dateRange.from,
        p_date_to: dateRange.to,
        p_min_durata: durataMinima,
        p_mode: modeConversioniArea
      });

      if (error) {
        console.error('[v0] Errore caricamento conversioni area:', error.message);
      } else if (data) {
        setConversioniAreaData(data);
      }
    } catch (e) {
      console.error('[v0] Exception conversioni area:', e);
    } finally {
      setLoadingConversioniArea(false);
    }
  };

  // ===== HANDLER: Drilldown conversioni per area =====
  const handleDrilldownArea = async (area: { area_id: string; nome_area: string }) => {
    setDrilldownArea(area);
    setDrilldownData([]);
    setDrilldownPage(20);
    setDrilldownSort({ key: 'data_chiamata', dir: 'desc' });
    setLoadingDrilldown(true);
    try {
      const { data, error } = await supabase.rpc('conversioni_area_get_dettaglio', {
        p_date_from: dateRange.from,
        p_date_to: dateRange.to,
        p_area_id: area.area_id,
        p_min_durata: durataMinima
      });
      if (error) {
        console.error('[v0] Errore drilldown conversioni area:', error.message);
      } else if (data) {
        setDrilldownData(data);
      }
    } catch (e) {
      console.error('[v0] Exception drilldown conversioni area:', e);
    } finally {
      setLoadingDrilldown(false);
    }
  };

  // Funzione per trasformare distribuzione code grezze in categorie intelligenti
  const transformCodaDistribution = (codaData: CodaDistribution[], numeriHotel: string[]): Array<{ name: string; value: number }> => {
    const categories: { [key: string]: number } = {
      'Acchiappi Booking': 0,
      'Acchiappi Area': 0,
      'Risponditore Automatico': 0,
      'Risposte Area': 0,
      'Risposte Booking': 0
    };

    codaData.forEach((coda) => {
      const codaStr = coda.coda_destinazione;
      const count = coda.count_answered;

      // Regola 1: code che iniziano con 9 e hanno come terza cifra 3 → "Acchiappi Booking"
      if (codaStr.startsWith('9') && codaStr[2] === '3') {
        categories['Acchiappi Booking'] += count;
      }
      // Regola 2: code che iniziano con 9 e hanno come terza cifra 2 → "Acchiappi Area"
      else if (codaStr.startsWith('9') && codaStr[2] === '2') {
        categories['Acchiappi Area'] += count;
      }
      // Regola 3: code che corrispondono ai numeri hotel selezionati → "Risponditore Automatico"
      else if (numeriHotel.includes(codaStr)) {
        categories['Risponditore Automatico'] += count;
      }
      // Regola 4: code che iniziano con "80" → "Risposte Area"
      else if (codaStr.startsWith('80')) {
        categories['Risposte Area'] += count;
      }
      // Regola 5: code che iniziano con "81" → "Risposte Booking"
      else if (codaStr.startsWith('81')) {
        categories['Risposte Booking'] += count;
      }
    });

    // Converti in array e filtra le categorie vuote
    return Object.entries(categories)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
  };

  const calculateKPI = (data: CallData[]): KPIMetrics => {
    const totaleChiamate = data.length;
    const risposte = data.filter(d => d.esito === 'ANSWERED').length;
    const durataTotale = data
      .filter(d => d.esito === 'ANSWERED')
      .reduce((sum, d) => sum + (d.durata_secondi || 0), 0);
    const tassoConversione = totaleChiamate > 0 ? Math.round((risposte / totaleChiamate) * 100) : 0;

    // Top 3 numeri o agenti
    const itemCount = new Map<string, number>();
    data.forEach(d => {
      let item: string | undefined;
      if (activeTab === 'ricevute') {
        item = d.numero_chiamato; // Per inbound: numero_chiamato
      } else {
        item = d.operatore_chiamante; // Per outbound: operatore_chiamante
      }
      if (item) {
        itemCount.set(item, (itemCount.get(item) || 0) + 1);
      }
    });

    const topNumeri = Array.from(itemCount.entries())
      .map(([numero, count]) => ({ numero, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return { totaleChiamate, risposte, durataTotale, tassoConversione, topNumeri };
  };

  const prepareTimeSeriesData = (data: CallData[]) => {
    const dateCount = new Map<string, number>();
    data.forEach(d => {
      if (d.data) {
        dateCount.set(d.data, (dateCount.get(d.data) || 0) + 1);
      }
    });

    return Array.from(dateCount.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const prepareHeatmapData = (data: CallData[]) => {
    const oraMap = new Map<number, { ANSWERED: number; 'NO ANSWER': number; BUSY: number }>();
    
    // Inizializza la mappa con tutte le ore 8-21
    for (let i = 8; i <= 21; i++) {
      oraMap.set(i, { ANSWERED: 0, 'NO ANSWER': 0, BUSY: 0 });
    }
    
    // Popola i conteggi per esito per ogni ora
    data.forEach(d => {
      // Parsa l'ora dal formato "HH:MM:SS"
      const oraHH = parseInt(d.ora.split(':')[0], 10);
      if (oraHH >= 8 && oraHH <= 21 && oraMap.has(oraHH)) {
        const esito = d.esito as 'ANSWERED' | 'NO ANSWER' | 'BUSY';
        if (esito === 'ANSWERED' || esito === 'NO ANSWER' || esito === 'BUSY') {
          oraMap.get(oraHH)![esito]++;
        }
      }
    });

    return Array.from(oraMap.entries())
      .map(([ora, counts]) => ({
        ora,
        ...counts,
      }))
      .sort((a, b) => a.ora - b.ora);
  };

  const prepareTimeSeriesDetailed = (data: CallData[]) => {
    const dateMap = new Map<string, { ANSWERED: number; 'NO ANSWER': number; BUSY: number }>();
    data.forEach(d => {
      if (d.data) {
        if (!dateMap.has(d.data)) {
          dateMap.set(d.data, { ANSWERED: 0, 'NO ANSWER': 0, BUSY: 0 });
        }
        const esito = d.esito as 'ANSWERED' | 'NO ANSWER' | 'BUSY';
        if (esito === 'ANSWERED' || esito === 'NO ANSWER' || esito === 'BUSY') {
          dateMap.get(d.data)![esito]++;
        }
      }
    });

    return Array.from(dateMap.entries())
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const prepareTimeSeriesDetailedOutbound = (data: CallData[]) => {
    const dateMap = new Map<string, { ANSWERED: number; 'NO ANSWER': number; BUSY: number }>();
    data.forEach(d => {
      if (d.data) {
        if (!dateMap.has(d.data)) {
          dateMap.set(d.data, { ANSWERED: 0, 'NO ANSWER': 0, BUSY: 0 });
        }
        const esito = d.esito as 'ANSWERED' | 'NO ANSWER' | 'BUSY';
        if (esito === 'ANSWERED' || esito === 'NO ANSWER' || esito === 'BUSY') {
          dateMap.get(d.data)![esito]++;
        }
      }
    });

    return Array.from(dateMap.entries())
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const prepareHeatmapDataOutbound = (data: CallData[]) => {
    const oraMap = new Map<number, { ANSWERED: number; 'NO ANSWER': number; BUSY: number }>();
    
    // Inizializza la mappa con tutte le ore 8-21
    for (let i = 8; i <= 21; i++) {
      oraMap.set(i, { ANSWERED: 0, 'NO ANSWER': 0, BUSY: 0 });
    }
    
    // Popola i conteggi per esito per ogni ora
    data.forEach(d => {
      // Parsa l'ora dal formato "HH:MM:SS"
      const oraHH = parseInt(d.ora.split(':')[0], 10);
      if (oraHH >= 8 && oraHH <= 21 && oraMap.has(oraHH)) {
        const esito = d.esito as 'ANSWERED' | 'NO ANSWER' | 'BUSY';
        if (esito === 'ANSWERED' || esito === 'NO ANSWER' || esito === 'BUSY') {
          oraMap.get(oraHH)![esito]++;
        }
      }
    });

    return Array.from(oraMap.entries())
      .map(([ora, counts]) => ({
        ora,
        ...counts,
      }))
      .sort((a, b) => a.ora - b.ora);
  };

  const handleApply = async () => {
    if (!dateRange.from || !dateRange.to) {
      alert('Seleziona un range di date');
      return;
    }

    setLoading(true);
    try {
      // Carica dati inbound
      const { data: inboundRaw, error: inboundError } = await supabase.rpc(
        'get_inbound_catia',
        { data_inizio: dateRange.from, data_fine: dateRange.to }
      );

      // Carica dati outbound
      const { data: outboundRaw, error: outboundError } = await supabase.rpc(
        'get_outbound_catia',
        { data_inizio: dateRange.from, data_fine: dateRange.to }
      );

      // Carica lista hotel numbers per il dropdown
      const { data: hotelsRaw, error: hotelsError } = await supabase.rpc(
        'get_hotel_numbers_catia'
      );

      if (inboundError) {
        console.error('[v0] Errore inbound:', inboundError);
      } else {
        setInboundDataRaw(inboundRaw || []);
        setInboundData(inboundRaw || []);
        setInboundKPI(calculateKPI(inboundRaw || []));
        setInboundTimeSeries(prepareTimeSeriesData(inboundRaw || []));
        setInboundTimeSeriesDetailed(prepareTimeSeriesDetailed(inboundRaw || []));
        setInboundHeatmap(prepareHeatmapData(inboundRaw || []));
        setSelectedHotelNumbers([]);
        console.log('[v0] Dati inbound caricati:', inboundRaw?.length);
      }

      if (outboundError) {
        console.error('[v0] Errore outbound:', outboundError);
      } else {
        setOutboundData(outboundRaw || []);
        setOutboundKPI(calculateKPI(outboundRaw || []));
        setOutboundTimeSeries(prepareTimeSeriesData(outboundRaw || []));
        setOutboundTimeSeriesDetailed(prepareTimeSeriesDetailedOutbound(outboundRaw || []));
        setOutboundHeatmap(prepareHeatmapDataOutbound(outboundRaw || []));
        console.log('[v0] Dati outbound caricati:', outboundRaw?.length);
      }

      if (hotelsError) {
        console.error('[v0] Errore caricamento hotel:', hotelsError);
      } else {
        setHotelNumbers(hotelsRaw || []);
        console.log('[v0] Hotel caricati:', hotelsRaw?.length);
      }

      // Carica lista operatori (ottimizzata con JOIN su Agenti Youneed)
      const { data: operatoriListRaw, error: operatoriListError } = await supabase.rpc(
        'get_operatori_list_optimized',
        { data_inizio: dateRange.from, data_fine: dateRange.to }
      );

      if (operatoriListError) {
        console.error('[v0] Errore lista operatori:', operatoriListError);
      } else {
        setOperatoriList(operatoriListRaw || []);
        console.log('[v0] Lista operatori caricata:', operatoriListRaw?.length);
      }

      // Reset filtri operatori
      setSelectedOperatore('');
      setSelectedOperatoreNome('');
      setOperatoreStatistiche(null);
      setOperatoreCodaDistribution([]);
      setOperatoreSerieTemporale([]);
      setOperatoreDistribuzioneOraria([]);

      // Reset grafici coda e conversione - verranno popolati solo quando selezionato un numero
      setCodaDistribution([]);
      setConversionAnalysis([]);

      // Carica lista operatori outbound
      const { data: operatoriOutboundListRaw, error: operatoriOutboundListError } = await supabase.rpc(
        'get_operatori_outbound_list',
        { data_inizio: dateRange.from, data_fine: dateRange.to }
      );

      if (operatoriOutboundListError) {
        console.error('[v0] Errore lista operatori outbound:', operatoriOutboundListError);
      } else {
        setOperatoriOutboundList(operatoriOutboundListRaw || []);
        console.log('[v0] Lista operatori outbound caricata:', operatoriOutboundListRaw?.length);
      }

      // Reset filtri operatori outbound
      setSelectedOperatoreOutbound('');
      setSelectedOperatoreOutboundNome('');
      setOperatoreOutboundStatistiche(null);
      setOperatoreOutboundSerieTemporale([]);

      // Carica best performers outbound
      const [bestMaxChiamateRaw, bestRapportoSuccessoRaw, bestDurataTotaleRaw, bestDurataMediaMinRaw, bestDurataMediaMaxRaw] = await Promise.all([
        supabase.rpc('get_operatore_outbound_max_chiamate', { data_inizio: dateRange.from, data_fine: dateRange.to }),
        supabase.rpc('get_operatore_outbound_max_rapporto', { data_inizio: dateRange.from, data_fine: dateRange.to }),
        supabase.rpc('get_operatore_outbound_max_durata_totale', { data_inizio: dateRange.from, data_fine: dateRange.to }),
        supabase.rpc('get_operatore_outbound_min_durata_media', { data_inizio: dateRange.from, data_fine: dateRange.to }),
        supabase.rpc('get_operatore_outbound_max_durata_media', { data_inizio: dateRange.from, data_fine: dateRange.to })
      ]);

      if (!bestMaxChiamateRaw.error && bestMaxChiamateRaw.data?.length > 0) {
        setBestMaxChiamate(bestMaxChiamateRaw.data[0]);
      }
      if (!bestRapportoSuccessoRaw.error && bestRapportoSuccessoRaw.data?.length > 0) {
        setBestRapportoSuccesso(bestRapportoSuccessoRaw.data[0]);
      }
      if (!bestDurataTotaleRaw.error && bestDurataTotaleRaw.data?.length > 0) {
        setBestDurataTotale(bestDurataTotaleRaw.data[0]);
      }
      if (!bestDurataMediaMinRaw.error && bestDurataMediaMinRaw.data?.length > 0) {
        setBestDurataMediaMin(bestDurataMediaMinRaw.data[0]);
      }
      if (!bestDurataMediaMaxRaw.error && bestDurataMediaMaxRaw.data?.length > 0) {
        setBestDurataMediaMax(bestDurataMediaMaxRaw.data[0]);
      }

      console.log('[v0] Best performers caricati');
    } catch (error) {
      console.error('[v0] Errore durante il caricamento:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHotelNumbersChange = async (selectedNumeri: string[]) => {
    setSelectedHotelNumbers(selectedNumeri);
    
    if (selectedNumeri.length === 0) {
      // Reset ai dati completi e svuota grafici
      setInboundData(inboundDataRaw);
      setInboundKPI(calculateKPI(inboundDataRaw));
      setInboundTimeSeries(prepareTimeSeriesData(inboundDataRaw));
      setInboundTimeSeriesDetailed(prepareTimeSeriesDetailed(inboundDataRaw));
      setInboundHeatmap(prepareHeatmapData(inboundDataRaw));
      setCodaDistribution([]);
      setConversionAnalysis([]);
      return;
    }

    setLoadingHotels(true);
    try {
      // Carica dati inbound per tutti i numeri selezionati
      let combinedFiltered: CallData[] = [];
      let combinedCodaDistribution: CodaDistribution[] = [];
      let combinedConversionAnalysis: ConversionAnalysis[] = [];

      // Processa ogni numero selezionato
      for (const numeroHotel of selectedNumeri) {
        // Carica dati inbound filtrati per numero
        const { data: filteredData, error: filteredError } = await supabase.rpc(
          'get_inbound_catia_by_number',
          {
            numero_hotel: numeroHotel,
            data_inizio: dateRange.from,
            data_fine: dateRange.to
          }
        );

        if (!filteredError && filteredData) {
          combinedFiltered.push(...filteredData);
        }

        // Carica distribuzione code per il numero
        const { data: codaRaw, error: codaError } = await supabase.rpc(
          'get_inbound_coda_distribution_by_number',
          {
            numero_hotel: numeroHotel,
            data_inizio: dateRange.from,
            data_fine: dateRange.to
          }
        );

        if (!codaError && codaRaw) {
          combinedCodaDistribution.push(...codaRaw);
        }

        // Carica analisi conversione per il numero
        const { data: conversionRaw, error: conversionError } = await supabase.rpc(
          'get_inbound_conversion_analysis_by_number',
          {
            numero_hotel: numeroHotel,
            data_inizio: dateRange.from,
            data_fine: dateRange.to
          }
        );

        if (!conversionError && conversionRaw) {
          combinedConversionAnalysis.push(...conversionRaw);
        }
      }

      // Aggrega i dati di conversione per categoria
      const aggregatedConversion = new Map<string, number>();
      combinedConversionAnalysis.forEach((item) => {
        const existing = aggregatedConversion.get(item.categoria) || 0;
        aggregatedConversion.set(item.categoria, existing + item.count_chiamate);
      });

      const aggregatedConversionAnalysis: ConversionAnalysis[] = Array.from(
        aggregatedConversion.entries()
      ).map(([categoria, count_chiamate]) => ({
        categoria,
        count_chiamate
      }));

      setInboundData(combinedFiltered);
      setInboundKPI(calculateKPI(combinedFiltered));
      setInboundTimeSeries(prepareTimeSeriesData(combinedFiltered));
      setInboundTimeSeriesDetailed(prepareTimeSeriesDetailed(combinedFiltered));
      setInboundHeatmap(prepareHeatmapData(combinedFiltered));
      setCodaDistribution(combinedCodaDistribution);
      setConversionAnalysis(aggregatedConversionAnalysis);
      
      console.log('[v0] Dati filtrati per numeri:', combinedFiltered.length, 'hotel selezionati:', selectedNumeri.length);
    } catch (error) {
      console.error('[v0] Errore durante il filtro multi-hotel:', error);
    } finally {
      setLoadingHotels(false);
    }
  };

  const handleOperatoreChange = async (profilo: string, nome: string) => {
    setSelectedOperatore(profilo);
    setSelectedOperatoreNome(nome);
    
    if (!profilo) {
      setOperatoreStatistiche(null);
      setOperatoreCodaDistribution([]);
      setOperatoreSerieTemporale([]);
      setOperatoreDistribuzioneOraria([]);
      return;
    }

    setLoadingOperatore(true);
    try {
      // Carica statistiche operatore (ottimizzata con JOIN)
      const { data: statsRaw, error: statsError } = await supabase.rpc(
        'get_operatore_statistiche_optimized',
        {
          profilo_agente: profilo,
          data_inizio: dateRange.from,
          data_fine: dateRange.to
        }
      );

      if (!statsError && statsRaw && statsRaw.length > 0) {
        setOperatoreStatistiche(statsRaw[0]);
        console.log('[v0] Statistiche operatore:', statsRaw[0]);
      }

      // Carica distribuzione code (ottimizzata con JOIN)
      const { data: codaRaw, error: codaError } = await supabase.rpc(
        'get_operatore_coda_distribution_optimized',
        {
          profilo_agente: profilo,
          data_inizio: dateRange.from,
          data_fine: dateRange.to
        }
      );

      if (!codaError) {
        setOperatoreCodaDistribution(codaRaw || []);
        console.log('[v0] Coda operatore caricata:', codaRaw?.length);
      }

      // Carica serie temporale (ottimizzata con JOIN)
      const { data: timeSeriesRaw, error: timeSeriesError } = await supabase.rpc(
        'get_operatore_serie_temporale_optimized',
        {
          profilo_agente: profilo,
          data_inizio: dateRange.from,
          data_fine: dateRange.to
        }
      );

      if (!timeSeriesError) {
        setOperatoreSerieTemporale(timeSeriesRaw || []);
        console.log('[v0] Serie temporale operatore caricata:', timeSeriesRaw?.length);
      }

      // Carica distribuzione oraria (ottimizzata con JOIN)
      const { data: orariaRaw, error: orariaError } = await supabase.rpc(
        'get_operatore_distribuzione_oraria_optimized',
        {
          profilo_agente: profilo,
          data_inizio: dateRange.from,
          data_fine: dateRange.to
        }
      );

      if (!orariaError) {
        setOperatoreDistribuzioneOraria(orariaRaw || []);
        console.log('[v0] Distribuzione oraria operatore caricata:', orariaRaw?.length);
      }
    } catch (error) {
      console.error('[v0] Errore durante il caricamento operatore:', error);
    } finally {
      setLoadingOperatore(false);
    }
  };

  const handleOperatoreOutboundChange = async (profilo: string, nome: string) => {
    setSelectedOperatoreOutbound(profilo);
    setSelectedOperatoreOutboundNome(nome);
    
    if (!profilo) {
      setOperatoreOutboundStatistiche(null);
      setOperatoreOutboundSerieTemporale([]);
      return;
    }

    setLoadingOperatoreOutbound(true);
    try {
      // Carica statistiche operatore outbound
      const { data: statsRaw, error: statsError } = await supabase.rpc(
        'get_operatore_outbound_statistiche',
        {
          profilo_senza_sigla_agente: profilo,
          data_inizio: dateRange.from,
          data_fine: dateRange.to
        }
      );

      if (!statsError && statsRaw && statsRaw.length > 0) {
        setOperatoreOutboundStatistiche(statsRaw[0]);
        console.log('[v0] Statistiche operatore outbound:', statsRaw[0]);
      }

      // Carica serie temporale operatore outbound
      const { data: timeSeriesRaw, error: timeSeriesError } = await supabase.rpc(
        'get_operatore_outbound_serie_temporale',
        {
          profilo_senza_sigla_agente: profilo,
          data_inizio: dateRange.from,
          data_fine: dateRange.to
        }
      );

      if (!timeSeriesError) {
        setOperatoreOutboundSerieTemporale(timeSeriesRaw || []);
        console.log('[v0] Serie temporale operatore outbound caricata:', timeSeriesRaw?.length);
      }
    } catch (error) {
      console.error('[v0] Errore durante il caricamento operatore outbound:', error);
    } finally {
      setLoadingOperatoreOutbound(false);
    }
  };

  const currentKPI = activeTab === 'ricevute' ? inboundKPI : outboundKPI;

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground">Catia</h1>
            <button
              onClick={() => setShowInfoDialog(true)}
              className="w-8 h-8 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center justify-center text-sm font-bold cursor-pointer"
              title="Informazioni sul sistema"
            >
              ?
            </button>
          </div>
          <p className="text-muted-foreground mt-2">Analisi e reporting</p>
        </div>

        <Card className="p-6">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Box Filtri</h2>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium text-foreground block mb-2">Data Inizio</label>
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-foreground block mb-2">Data Fine</label>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <button
                onClick={handleApply}
                disabled={loading}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? 'Caricamento...' : 'Applica'}
              </button>
            </div>
          </div>
        </Card>

        <div className="flex gap-2 border-b border-border">
          {(
            [
              { key: 'ricevute', label: 'RICEVUTE' },
              { key: 'effettuate', label: 'EFFETTUATE' },
              { key: 'operatori', label: 'OPERATORI' },
              { key: 'conversioni', label: 'CONVERSIONI' },
              { key: 'conversioni_area', label: 'CONVERSIONI AREA' },
            ] as { key: ActiveTab; label: string }[]
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-3 font-medium transition-colors ${
                activeTab === key
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'ricevute' && (
          <TabRicevute
            inboundDataRaw={inboundDataRaw}
            hotelNumbers={hotelNumbers}
            selectedHotelNumbers={selectedHotelNumbers}
            loadingHotels={loadingHotels}
            handleHotelNumbersChange={handleHotelNumbersChange}
            codaDistribution={codaDistribution}
            conversionAnalysis={conversionAnalysis}
            transformCodaDistribution={transformCodaDistribution}
            currentKPI={currentKPI}
            inboundTimeSeries={inboundTimeSeries}
            showDetailedSeries={showDetailedSeries}
            setShowDetailedSeries={setShowDetailedSeries}
            inboundTimeSeriesDetailed={inboundTimeSeriesDetailed}
            visibleSeries={visibleSeries}
            setVisibleSeries={setVisibleSeries}
            inboundHeatmap={inboundHeatmap}
            visibleHeatmapSeries={visibleHeatmapSeries}
            setVisibleHeatmapSeries={setVisibleHeatmapSeries}
          />
        )}

        {activeTab === 'effettuate' && (
          <TabEffettuate
            currentKPI={currentKPI}
            outboundTimeSeries={outboundTimeSeries}
            showDetailedSeriesOutbound={showDetailedSeriesOutbound}
            setShowDetailedSeriesOutbound={setShowDetailedSeriesOutbound}
            outboundTimeSeriesDetailed={outboundTimeSeriesDetailed}
            visibleSeriesOutbound={visibleSeriesOutbound}
            setVisibleSeriesOutbound={setVisibleSeriesOutbound}
            outboundHeatmap={outboundHeatmap}
            visibleHeatmapSeriesOutbound={visibleHeatmapSeriesOutbound}
            setVisibleHeatmapSeriesOutbound={setVisibleHeatmapSeriesOutbound}
            operatoriOutboundList={operatoriOutboundList}
            selectedOperatoreOutbound={selectedOperatoreOutbound}
            selectedOperatoreOutboundNome={selectedOperatoreOutboundNome}
            loadingOperatoreOutbound={loadingOperatoreOutbound}
            handleOperatoreOutboundChange={handleOperatoreOutboundChange}
            operatoreOutboundStatistiche={operatoreOutboundStatistiche}
            operatoreOutboundSerieTemporale={operatoreOutboundSerieTemporale}
            bestMaxChiamate={bestMaxChiamate}
            bestRapportoSuccesso={bestRapportoSuccesso}
            bestDurataTotale={bestDurataTotale}
            bestDurataMediaMin={bestDurataMediaMin}
            bestDurataMediaMax={bestDurataMediaMax}
          />
        )}

        {activeTab === 'operatori' && (
          <TabOperatori
            operatoriList={operatoriList}
            selectedOperatore={selectedOperatore}
            selectedOperatoreNome={selectedOperatoreNome}
            loadingOperatore={loadingOperatore}
            handleOperatoreChange={handleOperatoreChange}
            operatoreStatistiche={operatoreStatistiche}
            operatoreCodaDistribution={operatoreCodaDistribution}
            operatoreSerieTemporale={operatoreSerieTemporale}
            operatoreDistribuzioneOraria={operatoreDistribuzioneOraria}
          />
        )}

        {activeTab === 'conversioni' && (
          <TabConversioni
            dateRange={dateRange}
            setDateRange={setDateRange}
            selectedHotel={selectedHotel}
            setSelectedHotel={setSelectedHotel}
            hotelList={hotelList}
            conversioniPrenotazioniKPI={conversioniPrenotazioniKPI}
            criterioAttribuzione={criterioAttribuzione}
            setCriterioAttribuzione={setCriterioAttribuzione}
            handleConversioniRicerca={handleConversioniRicerca}
            loadingConversioni={loadingConversioni}
            conversioniAgentiStats={conversioniAgentiStats}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            handleSort={handleSort}
            getSortedStats={getSortedStats}
            handleShowDetails={handleShowDetails}
            conversioniPrenotazioniNoContact={conversioniPrenotazioniNoContact}
            selectedPrenotazioneDetails={selectedPrenotazioneDetails}
            showDetailsDialog={showDetailsDialog}
            setShowDetailsDialog={setShowDetailsDialog}
          />
        )}

        {activeTab === 'conversioni_area' && (
          <TabConversioniArea
            dateRange={dateRange}
            setDateRange={setDateRange}
            durataMinima={durataMinima}
            setDurataMinima={setDurataMinima}
            modeConversioniArea={modeConversioniArea}
            setModeConversioniArea={setModeConversioniArea}
            handleConversioniAreaRicerca={handleConversioniAreaRicerca}
            loadingConversioniArea={loadingConversioniArea}
            conversioniAreaData={conversioniAreaData}
            drilldownArea={drilldownArea}
            setDrilldownArea={setDrilldownArea}
            drilldownData={drilldownData}
            loadingDrilldown={loadingDrilldown}
            drilldownPage={drilldownPage}
            setDrilldownPage={setDrilldownPage}
            drilldownSort={drilldownSort}
            setDrilldownSort={setDrilldownSort}
            handleDrilldownArea={handleDrilldownArea}
          />
        )}

        {showInfoDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground">Come funziona il sistema di analisi</h2>
                  <button
                    onClick={() => setShowInfoDialog(false)}
                    className="text-muted-foreground hover:text-foreground text-2xl leading-none"
                  >
                    ×
                  </button>
                </div>

                <div className="rounded-lg overflow-hidden border border-border">
                  <img
                    src="/images/sistema-conversioni-diagram.jpg"
                    alt="Diagramma sistema conversioni"
                    className="w-full h-auto"
                  />
                </div>

                <div className="space-y-4 text-sm text-foreground">
                  <div>
                    <h3 className="font-semibold mb-2 text-base">✅ Come funziona il sistema di analisi delle telefonate</h3>
                    <p className="text-muted-foreground">Il sistema raccoglie e organizza automaticamente tutte le chiamate per fornire analisi affidabili e senza duplicazioni.</p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">I dati provengono da tre fonti:</p>
                    <ul className="text-muted-foreground space-y-1 ml-4">
                      <li>• <strong>Chiamate Inbound</strong> → informazioni sulle chiamate ricevute (numero, coda, data/ora, esito)</li>
                      <li>• <strong>Chiamate Outbound</strong> → informazioni sulle chiamate effettuate dagli operatori</li>
                      <li>• <strong>Telefonate Automatico</strong> → identifica l'operatore che ha effettivamente risposto</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">🔄 Eliminazione dei duplicati</h4>
                    <p className="text-muted-foreground mb-2">Quando una chiamata passa attraverso più code, il centralino genera più record della stessa telefonata.</p>
                    <p className="text-muted-foreground mb-2">Per evitare conteggi errati: <strong>il sistema importa solo l'ultimo passaggio della chiamata</strong>, cioè quello realmente gestito dall'operatore finale.</p>
                    <p className="text-muted-foreground"><strong>Esempio:</strong> il cliente chiama → la chiamata rimbalza tra più operatori → risponde l'ultimo operatore disponibile → Nel database viene salvata una sola chiamata, associata all'operatore che ha realmente gestito la conversazione.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">📊 Come leggere le sezioni dell'app</h4>
                    <ul className="text-muted-foreground space-y-2 ml-4">
                      <li><strong>RICEVUTE</strong><br/>Mostra l'elenco delle chiamate ricevute già pulite e raffinate (senza duplicati).</li>
                      <li><strong>EFFETTUATE</strong><br/>Storico completo delle chiamate in uscita, facilmente tracciabile perché proviene da un'unica sorgente dati.</li>
                      <li><strong>OPERATORI</strong><br/>Analisi delle performance dei singoli operatori basata esclusivamente sulle chiamate ricevute.</li>
                      <li><strong>CONVERSIONI</strong><br/>Incrocia le chiamate ricevute con lo storico prenotazioni: se una prenotazione avviene entro 7 giorni da una chiamata, viene attribuita all'operatore che ha gestito quel contatto.</li>
                    </ul>
                  </div>
                </div>

                <button
                  onClick={() => setShowInfoDialog(false)}
                  className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition-opacity"
                >
                  Chiudi
                </button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}

