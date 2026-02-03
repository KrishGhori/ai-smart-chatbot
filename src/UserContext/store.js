import { createContext } from "react";

export const DataContext = createContext();

export const use = {
  data: null,
  mime_type: null,
  imgUrl: null,
};

export const prevuse = {
  data: null,
  mime_type: null,
  prompt: null,
  imgUrl: null,
};
