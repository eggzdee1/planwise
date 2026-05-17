export type ProjectMember = {
  id: string;
  name: string | null;
  email: string | null;
};

export type ProjectUpdateEntry = {
  memberId: string;
  did: string;
  willDo: string;
  blockers: string;
};

export type ProjectUpdate = {
  id: string;
  createdAt: string;
  updatedAt: string;
  entries: ProjectUpdateEntry[];
};
