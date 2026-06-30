import { HORA_LETTERS } from '../types';
import { detailedContentEnglish, detailedContentSpanish } from './horaContent';
import type { HoraLetter, TaskCategory, TaskGroup } from '../types';

export interface ActivitySearchResult {
  good: HoraLetter[];
  bad: HoraLetter[];
  mixed: HoraLetter[];
  neutral: HoraLetter[];
}

export type AskDisplayGroup = TaskGroup | 'other';

export const CATEGORY_DISPLAY_GROUP: Record<TaskCategory, AskDisplayGroup> = {
  loan_applications: 'business',
  request_favors: 'business',
  new_business_ventures: 'business',
  contract_signing: 'business',
  debt_collection: 'business',
  loan_money: 'business',
  gambling_lotto_stocks: 'business',
  deal_with_government: 'business',
  business_general: 'business',
  business_credit: 'business',
  business_operations: 'business',
  business_startup: 'business',
  business_advancement: 'business',
  medical_procedures: 'medical',
  health_treatments: 'medical',
  physical_exercise: 'medical',
  medical_therapy: 'medical',
  medical_surgery: 'medical',
  legal_proceedings: 'legal',
  deal_with_lawyers: 'legal',
  legal_preparation: 'legal',
  legal_filing: 'legal',
  legal_disputes: 'legal',
  travel_planning: 'travel',
  travel_short: 'travel',
  travel_long: 'travel',
  moving_relocation: 'travel',
  marriage_engagements: 'other',
  study_research: 'other',
  mechanical_technical: 'other',
};

export const CATEGORIES_BY_GROUP: Record<AskDisplayGroup, TaskCategory[]> = {
  business: [
    'loan_applications', 'new_business_ventures', 'contract_signing', 'business_startup',
    'business_general', 'business_credit', 'business_operations', 'business_advancement',
    'debt_collection', 'loan_money', 'gambling_lotto_stocks', 'request_favors', 'deal_with_government',
  ],
  medical: ['medical_surgery', 'medical_therapy', 'medical_procedures', 'health_treatments', 'physical_exercise'],
  legal: ['legal_filing', 'legal_proceedings', 'legal_disputes', 'legal_preparation', 'deal_with_lawyers'],
  travel: ['travel_long', 'travel_short', 'travel_planning', 'moving_relocation'],
  other: ['marriage_engagements', 'study_research', 'mechanical_technical'],
};

export const ALL_CATEGORIES: TaskCategory[] = [
  ...CATEGORIES_BY_GROUP.business,
  ...CATEGORIES_BY_GROUP.medical,
  ...CATEGORIES_BY_GROUP.legal,
  ...CATEGORIES_BY_GROUP.travel,
  ...CATEGORIES_BY_GROUP.other,
];

// Keywords derived from the actual bullet text in detailedContentEnglish.
// Each keyword is matched as a case-insensitive substring of bullet lines (lines starting with '•').
const ACTIVITY_KEYWORDS: Record<TaskCategory, string[]> = {
  loan_applications:     ['borrow money', 'borrowing money', 'personal or business credit'],
  request_favors:        ['favors'],
  new_business_ventures: ['new enterprise', 'new business', 'new venture', 'new plan'],
  contract_signing:      ['contracts', 'sign deeds', 'sign papers', 'formalize contracts'],
  marriage_engagements:  ['marriage', 'married', 'engagement', 'courtship', 'marry'],
  moving_relocation:     ['moving house', 'move to a new house', 'company headquarters'],
  debt_collection:       ['collect accounts', 'collect money', 'money collection', 'gather money'],
  loan_money:            ['lend money', 'lend and borrow'],
  gambling_lotto_stocks: ['speculate in', 'speculation', 'stock market', 'games of chance'],
  travel_planning:       ['trip', 'journey', 'travel'],
  business_general:      ['businesses in general', 'dealing with the public', 'business or leisure'],
  medical_procedures:    ['medicine', 'therapeutic', 'surgical', 'healing'],
  legal_proceedings:     ['legal action', 'lawsuit', 'litigation', 'court'],
  physical_exercise:     ['physical than mental', 'real work and muscle'],
  study_research:        ['education', 'scientific research', 'scientific work', 'scientific', 'teaching'],
  health_treatments:     ['therapeutic system', 'therapeutic aid', 'take medicine', 'taking medicine'],
  deal_with_lawyers:     ['deal with lawyers', 'dealing with lawyers'],
  deal_with_government:  ['public officials', 'judges', 'magistrates', 'governors', 'police authorities', 'senators'],
  mechanical_technical:  ['mechanical problems', 'inventions', 'metallurgy', 'metal workers'],
  business_credit:       ['business credit', 'advertising campaign', 'consolidate', 'build prestige'],
  business_operations:   ['public business', 'auctions', 'businesses in general', 'dealing with the public'],
  business_startup:      ['new enterprise', 'new business', 'new venture', 'first financial investment'],
  business_advancement:  ['business advances', 'board meetings'],
  medical_therapy:       ['therapeutic system', 'therapeutic aid', 'take medicine', 'taking medicine', 'healing'],
  medical_surgery:       ['surgical'],
  legal_preparation:     ['analytical examination', 'pleas in courts', 'propositions, offers'],
  legal_filing:          ['legal action in courts', 'present documents to courts', 'court procedure', 'present responses'],
  legal_disputes:        ['adversaries', 'courts of justice', 'deal with enemies'],
  travel_short:          ['short trips', 'short trip'],
  travel_long:           ['long trip', 'long journey', 'long trips'],
};

function matchesAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some(kw => lower.includes(kw.toLowerCase()));
}

export function searchActivity(category: TaskCategory): ActivitySearchResult {
  const keywords = ACTIVITY_KEYWORDS[category];
  const good: HoraLetter[] = [];
  const bad: HoraLetter[] = [];
  const mixed: HoraLetter[] = [];
  const neutral: HoraLetter[] = [];

  for (const letter of HORA_LETTERS) {
    const content = detailedContentEnglish[letter];
    const bullets = (lines: string[]) => lines.filter(l => l.startsWith('•'));

    const inFavorable   = bullets(content.favorableActivities).some(l => matchesAny(l, keywords));
    const inUnfavorable = bullets(content.unfavorableActivities).some(l => matchesAny(l, keywords));

    if (inFavorable && inUnfavorable) mixed.push(letter);
    else if (inFavorable)             good.push(letter);
    else if (inUnfavorable)           bad.push(letter);
    else                              neutral.push(letter);
  }

  return { good, bad, mixed, neutral };
}

const STOP_WORDS = new Set([
  'i', 'a', 'an', 'the', 'to', 'for', 'my', 'me', 'do', 'be', 'is', 'are',
  'was', 'have', 'has', 'get', 'go', 'going', 'need', 'want', 'with', 'can',
  'will', 'am', 'at', 'on', 'in', 'of', 'or', 'and', 'but', 'if', 'so',
  'it', 'its', 'this', 'that', 'we', 'he', 'she', 'they', 'you', 'your',
  'our', 'his', 'her', 'up', 'out', 'as', 'by', 'from', 'not', 'no', 'any',
  'all', 'been', 'had', 'did', 'just', 'some', 'into', 'what', 'how',
  'when', 'where', 'who', 'which', 'would', 'should', 'could', 'also',
  'may', 'might', 'must', 'than', 'then', 'them', 'their', 'too', 'very',
  'el', 'la', 'los', 'las', 'un', 'una', 'de', 'del', 'en', 'que', 'se',
  'por', 'con', 'al', 'es', 'su', 'son', 'mi', 'yo', 'nos', 'les',
  'le', 'lo', 'ya', 'si', 'hay', 'ser', 'para', 'pero', 'muy',
]);

const SYNONYMS: Record<string, string[]> = {
  'loan':     ['borrow', 'lend', 'credit'],
  'loans':    ['borrow', 'lend', 'credit'],
  'debt':     ['collect', 'borrow'],
  'owe':      ['collect', 'borrow'],
  'wedding':  ['marriage', 'marry'],
  'attorney': ['lawyer'],
  'sue':      ['lawsuit', 'litigation', 'legal'],
  'suing':    ['lawsuit', 'litigation', 'legal'],
  'court':    ['lawsuit', 'litigation', 'legal'],
  'invest':   ['speculation', 'speculate', 'financial'],
  'doctor':   ['medical', 'medicine', 'therapeutic'],
  'hospital': ['surgical', 'medical', 'medicine'],
  'dentist':  ['medical', 'medicine'],
  'therapy':  ['therapeutic', 'medicine', 'healing'],
  'move':     ['moving', 'relocation', 'house'],
  'relocate': ['moving', 'relocation', 'house'],
  'trip':     ['travel', 'journey', 'trips'],
  'hire':     ['employees', 'servants', 'collectors'],
};

function expandTokens(tokens: string[]): string[] {
  const expanded = new Set(tokens);
  for (const token of tokens) {
    const syns = SYNONYMS[token];
    if (syns) syns.forEach(s => expanded.add(s));
  }
  return [...expanded];
}

export function tokenizeQuery(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[\s\W]+/)
    .filter(token => token.length >= 3 && !STOP_WORDS.has(token));
}

function stemToken(token: string): string {
  const suffixes = ['ically', 'ations', 'tion', 'ical', 'ions', 'ing', 'ery', 'ure', 'ate', 'ion', 'al', 'ed'];
  for (const suffix of suffixes) {
    if (token.endsWith(suffix) && token.length - suffix.length >= 4) {
      return token.slice(0, token.length - suffix.length);
    }
  }
  return token;
}

function countTokenHits(text: string, tokens: string[]): number {
  const lower = text.toLowerCase();
  return tokens.filter(token => {
    if (lower.includes(token)) return true;
    const stem = stemToken(token);
    return stem !== token && lower.includes(stem);
  }).length;
}

export function searchByFreeText(query: string, language: import('../types').Language = 'en'): ActivitySearchResult | null {
  const tokens = expandTokens(tokenizeQuery(query));
  if (tokens.length === 0) return null;

  const content = language === 'es' ? detailedContentSpanish : detailedContentEnglish;

  const good: HoraLetter[] = [];
  const bad: HoraLetter[] = [];
  const mixed: HoraLetter[] = [];
  const neutral: HoraLetter[] = [];

  for (const letter of HORA_LETTERS) {
    const c = content[letter];
    const favText = [c.generalDescription, c.characteristics, ...c.favorableActivities].join(' ');
    const unfavText = c.unfavorableActivities.join(' ');

    const favHits   = countTokenHits(favText, tokens);
    const unfavHits = countTokenHits(unfavText, tokens);

    if (favHits > 0 && unfavHits > 0)  mixed.push(letter);
    else if (favHits > 0)               good.push(letter);
    else if (unfavHits > 0)             bad.push(letter);
    else                                neutral.push(letter);
  }

  return { good, bad, mixed, neutral };
}
