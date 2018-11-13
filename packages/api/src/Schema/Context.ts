import * as Tag from "./Tag";

export interface Context {
  tagLoader: ReturnType<typeof Tag.loader>;
}

export const context = (): Context => ({
  tagLoader: Tag.loader()
});
