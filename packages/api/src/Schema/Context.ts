import * as Tag from "./Tag";

export interface Context {
  tagLoader: Tag.Loader;
}

export const context = (): Context => ({
  tagLoader: Tag.loader()
});
