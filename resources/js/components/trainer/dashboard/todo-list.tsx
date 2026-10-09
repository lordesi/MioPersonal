import { useId } from 'react';
import { Button } from '@/components/ui/button';
import type { TrainerTodo } from '@/types';

/** "Da fare" card: short list of things that need the trainer's attention. */
export default function TodoList({ todos }: { todos: TrainerTodo[] }) {
    const titleId = useId();

    return (
        <section aria-labelledby={titleId} className="flex flex-col gap-2.5">
            <h2
                id={titleId}
                className="text-lg font-semibold tracking-tight tabular-nums md:text-xl"
            >
                Da fare{' '}
                <span className="font-medium text-muted-foreground">
                    · {todos.length}
                </span>
            </h2>
            <ul className="overflow-hidden rounded-xl border bg-card">
                {todos.map((todo) => (
                    <li
                        key={todo.label}
                        className="flex items-center gap-2.5 border-b p-3 last:border-b-0 md:gap-3 md:px-3.5"
                    >
                        <span
                            aria-hidden="true"
                            className="hidden size-2 flex-none rounded-full bg-foreground md:block"
                        />
                        <span className="flex min-w-0 flex-1 flex-col">
                            <span className="text-sm font-semibold">
                                {todo.label}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {todo.hint}
                            </span>
                        </span>
                        <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-9 px-2.5 text-[13px] md:h-8"
                        >
                            <a href={todo.href}>{todo.cta}</a>
                        </Button>
                    </li>
                ))}
            </ul>
        </section>
    );
}
