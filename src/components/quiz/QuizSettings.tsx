import { useState } from "react";

export interface QuizSettingsState {
  title: string;
  description: string;
  template: string;
  logoUrl: string;
  showLogo: boolean;
  showTitle: boolean;
  showDescription: boolean;
  showQuestionNumber: boolean;
  collectionTiming: string;
  collectName: boolean;
  collectEmail: boolean;
  collectWhatsapp: boolean;
  deliveryTiming: string;
  isPublic: boolean;
}

export interface QuizSettingsActions {
  setTitle: (value: string) => void;
  setDescription: (value: string) => void;
  setTemplate: (value: string) => void;
  setLogoUrl: (value: string) => void;
  setShowLogo: (value: boolean) => void;
  setShowTitle: (value: boolean) => void;
  setShowDescription: (value: boolean) => void;
  setShowQuestionNumber: (value: boolean) => void;
  setCollectionTiming: (value: string) => void;
  setCollectName: (value: boolean) => void;
  setCollectEmail: (value: boolean) => void;
  setCollectWhatsapp: (value: boolean) => void;
  setDeliveryTiming: (value: string) => void;
  setIsPublic: (value: boolean) => void;
}

export const useQuizSettings = (initialState?: Partial<QuizSettingsState>): [QuizSettingsState, QuizSettingsActions] => {
  const [title, setTitle] = useState(initialState?.title || '');
  const [description, setDescription] = useState(initialState?.description || '');
  const [template, setTemplate] = useState(initialState?.template || 'moderno');
  const [logoUrl, setLogoUrl] = useState(initialState?.logoUrl || '');
  const [showLogo, setShowLogo] = useState(initialState?.showLogo ?? true);
  const [showTitle, setShowTitle] = useState(initialState?.showTitle ?? true);
  const [showDescription, setShowDescription] = useState(initialState?.showDescription ?? true);
  const [showQuestionNumber, setShowQuestionNumber] = useState(initialState?.showQuestionNumber ?? true);
  const [collectionTiming, setCollectionTiming] = useState(initialState?.collectionTiming || 'after');
  const [collectName, setCollectName] = useState(initialState?.collectName || false);
  const [collectEmail, setCollectEmail] = useState(initialState?.collectEmail || false);
  const [collectWhatsapp, setCollectWhatsapp] = useState(initialState?.collectWhatsapp || false);
  const [deliveryTiming, setDeliveryTiming] = useState(initialState?.deliveryTiming || 'immediate');
  const [isPublic, setIsPublic] = useState(initialState?.isPublic ?? true);

  const state: QuizSettingsState = {
    title,
    description,
    template,
    logoUrl,
    showLogo,
    showTitle,
    showDescription,
    showQuestionNumber,
    collectionTiming,
    collectName,
    collectEmail,
    collectWhatsapp,
    deliveryTiming,
    isPublic
  };

  const actions: QuizSettingsActions = {
    setTitle,
    setDescription,
    setTemplate,
    setLogoUrl,
    setShowLogo,
    setShowTitle,
    setShowDescription,
    setShowQuestionNumber,
    setCollectionTiming,
    setCollectName,
    setCollectEmail,
    setCollectWhatsapp,
    setDeliveryTiming,
    setIsPublic
  };

  return [state, actions];
};
