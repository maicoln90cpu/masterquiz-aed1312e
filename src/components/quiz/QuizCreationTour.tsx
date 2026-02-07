import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export const startQuizCreationTour = (t: (key: string) => string) => {
  const driverObj = driver({
    showProgress: true,
    showButtons: ['next', 'previous', 'close'],
    steps: [
      {
        element: '#questions-sidebar',
        popover: {
          title: t('quizTour.welcome'),
          description: t('quizTour.welcomeDescription'),
          side: "right",
          align: 'start'
        }
      },
      {
        element: '#add-question-btn',
        popover: {
          title: t('quizTour.addQuestion'),
          description: t('quizTour.addQuestionDescription'),
          side: "bottom",
          align: 'start'
        }
      },
      {
        element: '#block-palette',
        popover: {
          title: t('quizTour.blockPalette'),
          description: t('quizTour.blockPaletteDescription'),
          side: "left",
          align: 'start'
        }
      },
      {
        element: '#preview-button',
        popover: {
          title: t('quizTour.preview'),
          description: t('quizTour.previewDescription'),
          side: "bottom",
          align: 'start'
        }
      },
      {
        element: '#save-draft-btn',
        popover: {
          title: t('quizTour.save'),
          description: t('quizTour.saveDescription'),
          side: "bottom",
          align: 'start'
        }
      }
    ],
    nextBtnText: t('quizTour.next'),
    prevBtnText: t('quizTour.previous'),
    doneBtnText: t('quizTour.done')
  });

  driverObj.drive();
};
