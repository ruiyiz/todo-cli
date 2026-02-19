import { useMemo } from "react";
import { useAppState } from "../context.ts";
import { queryTodos } from "@core/db/repository.ts";
import { todayStr, tomorrowStr, endOfWeekStr, plus10DaysStr } from "@core/utils/date.ts";
import type { TodoWithList } from "@core/models/todo.ts";

export interface TodaySections {
  overdue: TodoWithList[];
  dueToday: TodoWithList[];
  thisWeek: TodoWithList[];
  next10Days: TodoWithList[];
  highPriority: TodoWithList[];
  all: TodoWithList[];
}

export function useTodayData(): TodaySections {
  const { state } = useAppState();
  return useMemo(() => {
    const today = todayStr();
    const tomorrow = tomorrowStr();
    const weekEnd = endOfWeekStr();
    const tenDaysEnd = plus10DaysStr();

    const overdue = queryTodos({ overdueBeforeDate: today, isCompleted: false });
    const dueToday = queryTodos({ dueDateFrom: today, dueDateTo: today, isCompleted: false });

    const seenIds = new Set<string>();
    for (const t of overdue) seenIds.add(t.id);
    for (const t of dueToday) seenIds.add(t.id);

    const thisWeekRaw = queryTodos({ dueDateFrom: tomorrow, dueDateTo: weekEnd, isCompleted: false });
    const thisWeek = thisWeekRaw.filter((t) => !seenIds.has(t.id));
    for (const t of thisWeek) seenIds.add(t.id);

    const weekEndDate = new Date(weekEnd + "T00:00:00");
    weekEndDate.setDate(weekEndDate.getDate() + 1);
    const afterWeekEnd = `${weekEndDate.getFullYear()}-${String(weekEndDate.getMonth() + 1).padStart(2, "0")}-${String(weekEndDate.getDate()).padStart(2, "0")}`;

    const next10Raw = queryTodos({ dueDateFrom: afterWeekEnd, dueDateTo: tenDaysEnd, isCompleted: false });
    const next10Days = next10Raw.filter((t) => !seenIds.has(t.id));
    for (const t of next10Days) seenIds.add(t.id);

    const highRaw = queryTodos({ priority: "prioritized", isCompleted: false });
    const highPriority = highRaw.filter((t) => !seenIds.has(t.id));

    const all = [...overdue, ...dueToday, ...thisWeek, ...next10Days, ...highPriority];
    return { overdue, dueToday, thisWeek, next10Days, highPriority, all };
  }, [state.refreshKey]);
}
