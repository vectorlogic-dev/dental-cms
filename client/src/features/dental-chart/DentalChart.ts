import './dental-chart.css';
import { el, qsa } from './dom';
import {
  createDefaultState,
  listAllToothIds,
  DentalChartState,
  ToothId,
  ToothState,
  ToothStatus,
  DentistRef,
  ToothHistoryEntry,
} from './types';

export interface DentalChartOptions {
  initialState?: DentalChartState;
  storageKey?: string; // default: "dentalChartState"
  onSelect?: (id: ToothId, state: ToothState) => void;
  onChange?: (state: DentalChartState) => void;
  dentists?: DentistRef[];
}

const TOOTH_STATUSES: ToothStatus[] = [
  'healthy',
  'caries',
  'missing',
  'filled',
  'crown',
  'root_canal',
  'implant',
  'extracted',
  'bridge',
];

const TOOTH_IDS = listAllToothIds();
const TOOTH_ID_SET = new Set<ToothId>(TOOTH_IDS);

const isToothId = (value: string | null): value is ToothId =>
  value !== null && TOOTH_ID_SET.has(value as ToothId);

const isToothStatus = (value: string): value is ToothStatus =>
  TOOTH_STATUSES.includes(value as ToothStatus);

const isDentistRef = (value: unknown): value is DentistRef => {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record._id === 'string' &&
    typeof record.firstName === 'string' &&
    typeof record.lastName === 'string'
  );
};

const isHistoryEntry = (value: unknown): value is ToothHistoryEntry => {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return typeof record.date === 'string';
};


const statusClass = (status: ToothStatus): string => `is-${status}`;

const cloneState = (state: DentalChartState): DentalChartState => {
  const copy = {} as DentalChartState;
  for (const id of TOOTH_IDS) {
    copy[id] = { ...state[id] };
  }
  return copy;
};

const normalizeState = (input?: DentalChartState): DentalChartState => {
  if (!input) {
    return createDefaultState();
  }
  const base = createDefaultState();
  for (const id of TOOTH_IDS) {
    const entry = input[id];
    if (!entry) continue;
    if (entry.id === id && isToothStatus(entry.status)) {
      base[id] = { ...entry };
    }
  }
  return base;
};

const toLegacyNumber = (id: ToothId): number => {
  const [quadrantText, positionText] = id.split('-');
  const quadrant = Number(quadrantText);
  const position = Number(positionText);
  if (quadrant === 1) {
    return 9 - position;
  }
  if (quadrant === 2) {
    return 8 + position;
  }
  if (quadrant === 3) {
    return 25 - position;
  }
  return 24 + position;
};

const fromLegacyNumber = (number: number): ToothId => {
  if (number >= 1 && number <= 8) {
    return `1-${9 - number}` as ToothId;
  }
  if (number >= 9 && number <= 16) {
    return `2-${number - 8}` as ToothId;
  }
  if (number >= 17 && number <= 24) {
    return `3-${25 - number}` as ToothId;
  }
  return `4-${number - 24}` as ToothId;
};

const parseStoredState = (raw: string | null): DentalChartState | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const base = createDefaultState();
    for (const id of TOOTH_IDS) {
      const entry = (parsed as Record<string, unknown>)[id];
      if (!entry || typeof entry !== 'object') continue;
      const record = entry as Record<string, unknown>;
      if (
        record.id === id &&
        typeof record.notes === 'string' &&
        typeof record.procedure === 'string' &&
        typeof record.updatedAt === 'string' &&
        typeof record.status === 'string' &&
        isToothStatus(record.status)
      ) {
        const dentist = record.dentist;
        const history = Array.isArray(record.history)
          ? record.history.filter(isHistoryEntry)
          : [];

        base[id] = {
          id,
          status: record.status,
          notes: record.notes,
          procedure: record.procedure,
          updatedAt: record.updatedAt,
          dentist: typeof dentist === 'string' || isDentistRef(dentist) ? dentist : undefined,
          history,
        };
      }
    }
    return base;
  } catch {
    return null;
  }
};

export class DentalChart {
  private container: HTMLElement;
  private options: DentalChartOptions;
  private state: DentalChartState;
  private selectedId: ToothId | null = null;
  private rootEl: HTMLElement | null = null;
  private chartEl: HTMLElement | null = null;
  private panelEl: HTMLElement | null = null;
  private toothElements = new Map<ToothId, SVGElement>();
  private fieldsetEl: HTMLFieldSetElement | null = null;
  private idInput: HTMLInputElement | null = null;
  private statusSelect: HTMLSelectElement | null = null;
  private notesInput: HTMLTextAreaElement | null = null;
  private procedureInput: HTMLInputElement | null = null;
  private dentistSelect: HTMLSelectElement | null = null;
  private historyContainer: HTMLElement | null = null;

  private onChartClick = (event: MouseEvent) => {
    const target = (event.target as Element | null)?.closest('.dc-tooth');
    if (!target) return;
    const idAttr = target.getAttribute('data-tooth');
    if (isToothId(idAttr)) {
      this.select(idAttr);
    }
  };

  private onChartKeydown = (event: KeyboardEvent) => {
    const target = (event.target as Element | null)?.closest('.dc-tooth');
    if (!target) return;
    const idAttr = target.getAttribute('data-tooth');
    if (!isToothId(idAttr)) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.select(idAttr);
      return;
    }

    const direction =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? -1
          : 0;
    if (direction === 0) return;
    event.preventDefault();
    const nextId = this.getAdjacentId(idAttr, direction);
    if (nextId) {
      this.select(nextId);
      const nextEl = this.toothElements.get(nextId);
      nextEl?.focus();
    }
  };

  private onFormSubmit = (event: SubmitEvent) => {
    event.preventDefault();
    this.saveSelectedTooth();
  };

  constructor(container: HTMLElement, options: DentalChartOptions = {}) {
    this.container = container;
    this.options = {
      storageKey: 'dentalChartState',
      ...options,
    };
    this.state = normalizeState(options.initialState);
  }

  mount(): void {
    if (this.rootEl) return;

    const stored =
      this.options.storageKey ? this.loadFromStorage() : null;
    if (stored) {
      this.state = stored;
    } else if (this.options.initialState) {
      this.state = normalizeState(this.options.initialState);
    } else {
      this.state = createDefaultState();
    }

    this.rootEl = el('div', 'dc-root');
    this.chartEl = el('div', 'dc-chart');
    this.panelEl = el('aside', 'dc-panel');
    this.panelEl.setAttribute('aria-live', 'polite');

    this.chartEl.innerHTML = this.buildChartMarkup();
    this.panelEl.appendChild(this.buildPanel());

    this.rootEl.append(this.chartEl, this.panelEl);
    this.container.appendChild(this.rootEl);

    this.cacheToothElements();
    this.applyStateToChart();
    this.updatePanel();

    this.chartEl.addEventListener('click', this.onChartClick);
    this.chartEl.addEventListener('keydown', this.onChartKeydown);
  }

  destroy(): void {
    if (!this.rootEl || !this.chartEl) return;
    this.chartEl.removeEventListener('click', this.onChartClick);
    this.chartEl.removeEventListener('keydown', this.onChartKeydown);

    const form = this.panelEl?.querySelector('form');
    form?.removeEventListener('submit', this.onFormSubmit);

    this.container.removeChild(this.rootEl);
    this.rootEl = null;
    this.chartEl = null;
    this.panelEl = null;
    this.toothElements.clear();
    this.selectedId = null;
  }

  getState(): DentalChartState {
    return cloneState(this.state);
  }

  setState(next: DentalChartState): void {
    this.state = normalizeState(next);
    this.persistState();
    this.applyStateToChart();
    this.updatePanel();
    if (this.options.onChange) {
      this.options.onChange(this.getState());
    }
  }

  select(id: ToothId): void {
    if (!this.state[id]) return;
    this.selectedId = id;
    this.updateSelection();
    this.updatePanel();
    const currentState = this.state[id];
    if (this.options.onSelect) {
      this.options.onSelect(id, { ...currentState });
    }
  }

  private getAdjacentId(current: ToothId, direction: 1 | -1): ToothId | null {
    const index = TOOTH_IDS.indexOf(current);
    if (index === -1) return null;
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= TOOTH_IDS.length) return null;
    return TOOTH_IDS[nextIndex];
  }

  private buildChartMarkup(): string {
    const upperIds = Array.from({ length: 16 }, (_, i) =>
      fromLegacyNumber(i + 1)
    );
    const lowerIds = Array.from({ length: 16 }, (_, i) =>
      fromLegacyNumber(32 - i)
    );

    const width = 520;
    const height = 440;
    const toothRadius = 12;
    const midX = width / 2;
    const radius = 180;
    const upperCenterY = 185;
    const lowerCenterY = 255;
    const viewBoxPadY = 30;

    const buildSemiCircle = (
      ids: ToothId[],
      centerY: number,
      direction: 'up' | 'down',
      labelOffset: number
    ) =>
      ids
        .map((id, index) => {
          const t = index / (ids.length - 1);
          const angle = Math.PI * (1 - t);
          const x = midX + radius * Math.cos(angle);
          const y =
            direction === 'down'
              ? centerY + radius * Math.sin(angle)
              : centerY - radius * Math.sin(angle);
          const legacyNumber = toLegacyNumber(id);
          const upperLeft = legacyNumber >= 1 && legacyNumber <= 4;
          const upperRight = legacyNumber >= 13 && legacyNumber <= 16;
          const lowerLeft = legacyNumber >= 29 && legacyNumber <= 32;
          const lowerRight = legacyNumber >= 17 && legacyNumber <= 20;
          const midLeft = legacyNumber === 5 || legacyNumber === 6 || legacyNumber === 27 || legacyNumber === 28;
          const midRight = legacyNumber === 11 || legacyNumber === 12 || legacyNumber === 21 || legacyNumber === 22;
          const xShift =
            upperLeft || lowerLeft
              ? -20
              : upperRight || lowerRight
                ? 20
                : midLeft
                  ? -8
                  : midRight
                    ? 8
                    : 0;
          const yShift = upperLeft || upperRight ? 20 : lowerLeft || lowerRight ? -20 : 0;
          const ly = y + labelOffset + yShift;
          const lx = x + xShift;
          return `
            <g class="dc-tooth-group">
              <circle
                class="dc-tooth"
                data-tooth="${id}"
                role="button"
                tabindex="0"
                aria-label="Tooth ${id}"
                cx="${x}"
                cy="${y}"
                r="${toothRadius}"
              />
              <text class="dc-tooth-label" x="${lx}" y="${ly}">${legacyNumber}</text>
            </g>
          `;
        })
        .join('');

    const upperRow = buildSemiCircle(upperIds, upperCenterY, 'up', -22);
    const lowerRow = buildSemiCircle(lowerIds, lowerCenterY, 'down', 26);
    const gapMidY = (upperCenterY + lowerCenterY) / 2;

    return `
      <svg class="dc-svg" viewBox="0 ${-viewBoxPadY} ${width} ${height + viewBoxPadY * 2}" role="img" aria-label="Dental chart" preserveAspectRatio="xMidYMid meet">
        <g class="dc-arch dc-upper">
          ${upperRow}
        </g>
        <g class="dc-arch dc-lower">
          ${lowerRow}
        </g>
        <text class="dc-arch-label" x="${midX}" y="${gapMidY - 28}">Upper (1–16)</text>
        <text class="dc-arch-label" x="${midX}" y="${gapMidY + 32}">Lower (32–17)</text>
      </svg>
      ${this.buildLegendMarkup()}
    `;
  }

  private buildLegendMarkup(): string {
    const items = TOOTH_STATUSES.map(
      (status) =>
        `<li class="dc-legend-item"><span class="dc-legend-swatch ${statusClass(
          status
        )}"></span>${status.replace('_', ' ')}</li>`
    ).join('');
    return `<ul class="dc-legend" aria-label="Tooth status legend">${items}</ul>`;
  }

  private buildPanel(): HTMLElement {
    const wrapper = el('div', 'dc-panel-inner');
    const title = el('h3', 'dc-panel-title');
    title.textContent = 'Tooth details';
    const hint = el('p', 'dc-panel-hint');
    hint.textContent = 'Select a tooth to edit its status.';

    const form = el('form', 'dc-form');
    form.addEventListener('submit', this.onFormSubmit);

    const fieldset = el('fieldset', 'dc-fieldset');
    fieldset.disabled = true;

    const idLabel = this.buildLabeledInput('Tooth ID', 'text');
    idLabel.input.readOnly = true;

    const statusLabel = el('label', 'dc-label');
    statusLabel.textContent = 'Status';
    const statusSelect = document.createElement('select');
    statusSelect.className = 'dc-select';
    for (const status of TOOTH_STATUSES) {
      const option = document.createElement('option');
      option.value = status;
      option.textContent = status.replace('_', ' ');
      statusSelect.appendChild(option);
    }
    statusLabel.appendChild(statusSelect);

    const dentistLabel = el('label', 'dc-label');
    dentistLabel.textContent = 'Dentist';
    const dentistSelect = document.createElement('select');
    dentistSelect.className = 'dc-select';
    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = 'Select Dentist';
    dentistSelect.appendChild(defaultOpt);
    
    if (this.options.dentists) {
      for (const dentist of this.options.dentists) {
        const option = document.createElement('option');
        option.value = dentist._id;
        option.textContent = `Dr. ${dentist.firstName} ${dentist.lastName}`;
        dentistSelect.appendChild(option);
      }
    }
    dentistLabel.appendChild(dentistSelect);

    const procedureLabel = this.buildLabeledInput('Procedure', 'text');
    const notesLabel = el('label', 'dc-label');
    notesLabel.textContent = 'Notes';
    const notesArea = document.createElement('textarea');
    notesArea.className = 'dc-textarea';
    notesArea.rows = 4;
    notesLabel.appendChild(notesArea);

    const saveButton = document.createElement('button');
    saveButton.type = 'submit';
    saveButton.className = 'dc-button';
    saveButton.textContent = 'Save';

    fieldset.append(
      idLabel.label,
      statusLabel,
      dentistLabel,
      procedureLabel.label,
      notesLabel,
      saveButton
    );
    form.appendChild(fieldset);

    const historySection = el('div', 'dc-history-section');
    const historyTitle = el('h4', 'dc-history-title');
    historyTitle.textContent = 'Recent History';
    const historyContainer = el('div', 'dc-history-container');
    historySection.append(historyTitle, historyContainer);

    wrapper.append(title, hint, form, historySection);

    this.fieldsetEl = fieldset;
    this.idInput = idLabel.input;
    this.statusSelect = statusSelect;
    this.dentistSelect = dentistSelect;
    this.procedureInput = procedureLabel.input;
    this.notesInput = notesArea;
    this.historyContainer = historyContainer;

    return wrapper;
  }

  private buildLabeledInput(labelText: string, type: 'text'): {
    label: HTMLLabelElement;
    input: HTMLInputElement;
  } {
    const label = el('label', 'dc-label');
    label.textContent = labelText;
    const input = document.createElement('input');
    input.type = type;
    input.className = 'dc-input';
    label.appendChild(input);
    return { label, input };
  }

  private cacheToothElements(): void {
    if (!this.chartEl) return;
    const teeth = qsa<SVGElement>(this.chartEl, '.dc-tooth');
    for (const tooth of teeth) {
      const idAttr = tooth.getAttribute('data-tooth');
      if (isToothId(idAttr)) {
        this.toothElements.set(idAttr, tooth);
      }
    }
  }

  private applyStateToChart(): void {
    for (const id of TOOTH_IDS) {
      const toothEl = this.toothElements.get(id);
      if (!toothEl) continue;
      this.applyStatusClass(toothEl, this.state[id].status);
    }
    this.updateSelection();
  }

  private applyStatusClass(toothEl: SVGElement, status: ToothStatus): void {
    for (const statusValue of TOOTH_STATUSES) {
      toothEl.classList.remove(statusClass(statusValue));
    }
    toothEl.classList.add(statusClass(status));
  }

  private updateSelection(): void {
    for (const [id, toothEl] of this.toothElements.entries()) {
      if (this.selectedId === id) {
        toothEl.classList.add('is-selected');
      } else {
        toothEl.classList.remove('is-selected');
      }
    }
  }

  private updatePanel(): void {
    if (!this.fieldsetEl || !this.idInput || !this.statusSelect || !this.notesInput || !this.procedureInput || !this.dentistSelect) {
      return;
    }
    if (!this.selectedId) {
      this.fieldsetEl.disabled = true;
      this.idInput.value = '';
      this.statusSelect.value = 'healthy';
      this.dentistSelect.value = '';
      this.notesInput.value = '';
      this.procedureInput.value = '';
      return;
    }
    const current = this.state[this.selectedId];
    this.fieldsetEl.disabled = false;
    this.idInput.value = current.id;
    this.statusSelect.value = current.status;
    this.dentistSelect.value = typeof current.dentist === 'string' ? current.dentist : current.dentist?._id || '';
    this.notesInput.value = current.notes;
    this.procedureInput.value = current.procedure;
    this.renderHistory(current.history || []);
  }

  private renderHistory(history: ToothHistoryEntry[]): void {
    if (!this.historyContainer) return;
    this.historyContainer.innerHTML = '';
    
    if (history.length === 0) {
      const empty = el('p', 'dc-history-empty');
      empty.textContent = 'No previous procedures.';
      this.historyContainer.appendChild(empty);
      return;
    }

    // Sort by date descending
    const sorted = [...history].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    for (const entry of sorted) {
      const item = el('div', 'dc-history-item');
      
      const header = el('div', 'dc-history-header');
      const proc = el('span', 'dc-history-proc');
      proc.textContent = entry.procedure || 'Unknown Procedure';
      const date = el('span', 'dc-history-date');
      date.textContent = new Date(entry.date).toLocaleString([], { 
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
      header.append(proc, date);

      item.appendChild(header);

      if (entry.dentist) {
        const dentist = el('div', 'dc-history-dentist');
        const name = typeof entry.dentist === 'object' 
          ? `Dr. ${entry.dentist.firstName} ${entry.dentist.lastName}`
          : entry.dentist;
        dentist.textContent = name;
        item.appendChild(dentist);
      }

      if (entry.notes) {
        const notes = el('p', 'dc-history-notes');
        notes.textContent = entry.notes;
        item.appendChild(notes);
      }

      this.historyContainer.appendChild(item);
    }
  }

  private saveSelectedTooth(): void {
    if (!this.selectedId || !this.statusSelect || !this.notesInput || !this.procedureInput || !this.dentistSelect) {
      return;
    }
    const nextStatus = isToothStatus(this.statusSelect.value)
      ? this.statusSelect.value
      : 'healthy';
    const nextState = cloneState(this.state);
    
    let dentist: string | DentistRef = this.dentistSelect.value;
    if (dentist && this.options.dentists) {
      const found = this.options.dentists.find((d) => d._id === dentist);
      if (found) dentist = found;
    }

    nextState[this.selectedId] = {
      id: this.selectedId,
      status: nextStatus,
      notes: this.notesInput.value,
      procedure: this.procedureInput.value,
      dentist: dentist || undefined,
      updatedAt: new Date().toISOString(),
    };
    this.setState(nextState);
  }

  private loadFromStorage(): DentalChartState | null {
    if (!this.options.storageKey) return null;
    try {
      const raw = localStorage.getItem(this.options.storageKey);
      return parseStoredState(raw);
    } catch {
      return null;
    }
  }

  private persistState(): void {
    if (!this.options.storageKey) return;
    try {
      localStorage.setItem(this.options.storageKey, JSON.stringify(this.state));
    } catch {
      // ignore persistence failures
    }
  }
}
