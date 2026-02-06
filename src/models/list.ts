export interface List {
  id: string;
  title: string;
  created_at: string;
}

export interface ListWithCount extends List {
  todo_count: number;
  completed_count: number;
}
