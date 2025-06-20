export const sortByDateDesc = <T extends { updated_at: string }>(a: T, b: T) =>
  new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
