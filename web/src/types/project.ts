export type ProjectOwner = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
};

export type Project = {
  id: string;
  name: string;
  createdAt: string;
  owner: ProjectOwner;
};
