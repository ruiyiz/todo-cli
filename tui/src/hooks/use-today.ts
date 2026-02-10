import { useMemo } from "react";
import { useAppState } from "../context.ts";
import { queryTodos } from "@core/db/repository.ts";
import { todayStr, weekEndStr } from "@core/utils/date.ts";
import type { TodoWithList } from "@core/models/todo.ts";

export interface TodaySections {
  overdue: TodoWithList[];
  dueToday: TodoWithList[];
  upcoming: TodoWithList[];
  highPriority: TodoWithList[];
  all: TodoWithList[];
}

export function useTodayData(): TodaySections {
  const { state } = useAppState();
  return useMemo(() => {
    const today = todayStr();
    const weekEnd = weekEndStr();

    const overdue = queryTodos({ overdueBeforeDate: today, isCompleted: false });
    const dueToday = queryTodos({ dueDateFrom: today, dueDateTo: today, isCompleted: false });

    const seenIds = new Set<string>();
    for (const t of overdue) seenIds.add(t.id);
    for (const t of dueToday) seenIds.add(t.id);

    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = tomorrowDate.toISOString().slice(0, 10);

    const upcomingRaw = queryTodos({ dueDateFrom: tomorrowStr, dueDateTo: weekEnd, isCompleted: false });
    const upcoming = upcomingRaw.filter((t) => !seenIds.has(t.id));
    for (const t of upcoming) seenIds.add(t.id);

    const highRaw = queryTodos({ priority: "prioritized", isCompleted: false });
    const highPriority = highRaw.filter((t) => !seenIds.has(t.id));

    const all = [...overdue, ...dueToday, ...upcoming, ...highPriority];
    return { overdue, dueToday, upcoming, highPriority, all };
  }, [state.refreshKey]);
}
