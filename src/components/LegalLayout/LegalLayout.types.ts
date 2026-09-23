export type LegalSection = {
  id: string;
  heading: string;
  body: string;
};

export type LegalLayoutProps = {
  title: string;
  updatedLabel: string;
  intro: string;
  sections: LegalSection[];
  backHomeLabel: string;
};
