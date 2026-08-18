import React from 'react';

import type { Language } from '../hooks/useLanguage';
import { SOLUTION_TRANSLATIONS } from '../translations/solutionTranslations';

type Props = {
  language: Language;
  children: React.ReactNode;
};

const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();

const translateString = (value: string, language: Language) => {
  if (language === 'vi') return value;
  const normalized = normalize(value);
  const translated = SOLUTION_TRANSLATIONS[language][normalized];
  if (translated === undefined) return value;
  const leading = value.match(/^\s*/)?.[0] ?? '';
  const trailing = value.match(/\s*$/)?.[0] ?? '';
  return `${leading}${translated}${trailing}`;
};

const translateNode = (node: React.ReactNode, language: Language): React.ReactNode => {
  if (typeof node === 'string') return translateString(node, language);
  if (Array.isArray(node)) return node.map((child) => translateNode(child, language));
  if (!React.isValidElement(node)) return node;

  const element = node as React.ReactElement<Record<string, unknown>>;
  const nextProps: Record<string, unknown> = {};
  for (const prop of ['aria-label', 'title'] as const) {
    const value = element.props[prop];
    if (typeof value === 'string') nextProps[prop] = translateString(value, language);
  }

  if ('children' in element.props) {
    nextProps.children = translateNode(element.props.children as React.ReactNode, language);
  }

  return React.cloneElement(element, nextProps);
};

export const SolutionTranslatedContent: React.FC<Props> = ({ language, children }) => (
  <>{translateNode(children, language)}</>
);
