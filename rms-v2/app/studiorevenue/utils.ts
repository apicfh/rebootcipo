import { parseISO, format, getYear, getISOWeek, startOfDay, endOfDay } from 'date-fns';
import { it } from 'date-fns/locale';
import type { TimeSeriesData, Prenotazione, StagioneTariffaria } from './types';

export function getCorrespondingDateInPreviousYear(date: Date, yearsBack: number): Date {
  const targetDate = new Date(date);
  targetDate.setFullYear(targetDate.getFullYear() - yearsBack);
  return targetDate;
}

export function getTimeSeriesDateRange(): { inizio: Date; fine: Date } {
  const oggi = new Date();
  const mese = oggi.getMonth();
  const giorno = oggi.getDate();
  const anno = oggi.getFullYear();

  if (mese < 8 || (mese === 8 && giorno < 15)) {
    return {
      inizio: startOfDay(new Date(anno - 1, 8, 15)),
      fine: endOfDay(new Date(anno, 8, 14)),
    };
  } else {
    return {
      inizio: startOfDay(new Date(anno, 8, 15)),
      fine: endOfDay(new Date(anno + 1, 8, 14)),
    };
  }
}

export function filterTimeSeriesDataByWeeks(data: TimeSeriesData[], weeks: number | null): TimeSeriesData[] {
  if (weeks === null) return data;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - weeks * 7);
  const cutoffWeekKey = `${getYear(cutoffDate)}-W${String(getISOWeek(cutoffDate)).padStart(2, '0')}`;

  return data.filter(item => item.week >= cutoffWeekKey);
}

export function calculateCumulativeData(data: TimeSeriesData[]): TimeSeriesData[] {
  if (data.length === 0) return [];

  let cumulAnnoCorrente = 0;
  let cumulAnnoMeno1 = 0;
  let cumulAnnoMeno2 = 0;
  let cumulAnnoMeno3 = 0;

  return data.map((item) => ({
    ...item,
    anno_corrente: (cumulAnnoCorrente += item.anno_corrente),
    anno_meno_1: (cumulAnnoMeno1 += item.anno_meno_1),
    anno_meno_2: (cumulAnnoMeno2 += item.anno_meno_2),
    anno_meno_3: (cumulAnnoMeno3 += item.anno_meno_3),
  }));
}

export function filterTimeSeriesDataByDays(data: TimeSeriesData[], days: number | null): TimeSeriesData[] {
  if (days === null) return data;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoffDateString = format(cutoffDate, 'yyyy-MM-dd');

  return data.filter((item: any) => item.date >= cutoffDateString);
}

export function getSeasonRange(annoStagione: number) {
  const maggio = new Date(annoStagione, 4, 31);
  let ultimoSabato = maggio;
  while (ultimoSabato.getDay() !== 6) {
    ultimoSabato.setDate(ultimoSabato.getDate() - 1);
  }

  const settembre = new Date(annoStagione, 8, 1);
  let secondaDomenica = settembre;
  let domenicheContate = 0;
  while (domenicheContate < 2) {
    if (settembre.getDay() === 0) domenicheContate++;
    settembre.setDate(settembre.getDate() + 1);
  }

  return { start: ultimoSabato, end: settembre };
}

export function calculateOccupancyOverlap(
  prenotazioni: Prenotazione[],
  annoOggi: number,
  snapshotDateFilter: string = ''
) {
  const occupancyMap = new Map<string, { display_date: string; anno_corrente: number; anno_meno_1: number; anno_meno_2: number; anno_meno_3: number }>();

  prenotazioni.forEach((p) => {
    if (!p.arrivo || !p.partenza) return;

    const dataArrivo = parseISO(p.arrivo);
    const dataPartenza = parseISO(p.partenza);
    const annoArrivo = getYear(dataArrivo);
    const meseArrivo = dataArrivo.getMonth() + 1;

    if (meseArrivo < 5 || meseArrivo > 9) return;

    const differenzaAnni = annoOggi - annoArrivo;
    if (differenzaAnni < 0 || differenzaAnni > 3) return;

    if (snapshotDateFilter) {
      const dataPrenotazione = parseISO(p.data_prenotazione!);
      const snapshotDateParsed = parseISO(snapshotDateFilter);
      const annoPrenotazione = getYear(dataPrenotazione);
      const snapshotPerAnnoPrenotazione = new Date(annoPrenotazione, snapshotDateParsed.getMonth(), snapshotDateParsed.getDate());
      if (dataPrenotazione > snapshotPerAnnoPrenotazione) return;
    }

    const currentDate = new Date(dataArrivo);
    while (currentDate < dataPartenza) {
      const dataNormalizzata = new Date(annoOggi, currentDate.getMonth(), currentDate.getDate());
      const keyDate = format(dataNormalizzata, 'yyyy-MM-dd');
      const displayDate = format(dataNormalizzata, 'd MMM', { locale: it });

      if (!occupancyMap.has(keyDate)) {
        occupancyMap.set(keyDate, { display_date: displayDate, anno_corrente: 0, anno_meno_1: 0, anno_meno_2: 0, anno_meno_3: 0 });
      }

      const current = occupancyMap.get(keyDate)!;
      if (differenzaAnni === 0) current.anno_corrente++;
      else if (differenzaAnni === 1) current.anno_meno_1++;
      else if (differenzaAnni === 2) current.anno_meno_2++;
      else if (differenzaAnni === 3) current.anno_meno_3++;

      currentDate.setDate(currentDate.getDate() + 1);
    }
  });

  return occupancyMap;
}

export function calculateCameraTypeData(prenotazioni: Prenotazione[], annoOggi: number, stagioni: StagioneTariffaria[] = [], filtroStagioneId?: string) {
  const cameraTypeMap = new Map<string, { display_date: string; stagione_nome: string; counts: Map<string, number> }>();
  const cameraTypesSet = new Set<string>();

  const stagioniMap = new Map(stagioni.map(s => [s.id, s]));

  console.log('[v0] Calcolo camera type data - Prenotazioni totali:', prenotazioni.length, 'Stagioni disponibili:', stagioni.length, 'Filtro stagione:', filtroStagioneId);

  prenotazioni.forEach((p) => {
    if (!p.data_prenotazione || !p.arrivo || !p.tipo_camera) return;

    const dataArrivo = parseISO(p.arrivo);
    const annoArrivo = getYear(dataArrivo);

    if (annoOggi - annoArrivo !== 0) return;

    if (filtroStagioneId && p.stagione_tariffa !== filtroStagioneId) return;

    const dataPrenotazione = parseISO(p.data_prenotazione);
    const dataNormalizzata = new Date(annoOggi, dataPrenotazione.getMonth(), dataPrenotazione.getDate());
    const keyDate = format(dataNormalizzata, 'yyyy-MM-dd');
    const displayDate = format(dataNormalizzata, 'd MMM', { locale: it });

    let stagioneName = 'N/A';
    if (p.stagione_tariffa && stagioniMap.has(p.stagione_tariffa)) {
      const stagione = stagioniMap.get(p.stagione_tariffa)!;
      stagioneName = stagione.nome;
    }

    cameraTypesSet.add(p.tipo_camera);

    if (!cameraTypeMap.has(keyDate)) {
      cameraTypeMap.set(keyDate, { display_date: displayDate, stagione_nome: stagioneName, counts: new Map() });
    }

    const current = cameraTypeMap.get(keyDate)!;
    current.counts.set(p.tipo_camera, (current.counts.get(p.tipo_camera) || 0) + 1);
  });

  const cameraTypeArray = Array.from(cameraTypeMap.entries())
    .map(([date, values]) => {
      const row: any = { date, display_date: values.display_date, stagione_nome: values.stagione_nome };
      cameraTypesSet.forEach(cameraType => {
        row[cameraType] = values.counts.get(cameraType) || 0;
      });
      return row;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  console.log('[v0] Camera types trovati:', Array.from(cameraTypesSet));
  console.log('[v0] Punti dati camera type:', cameraTypeArray.length);

  return { data: cameraTypeArray, cameraTypes: Array.from(cameraTypesSet) };
}
