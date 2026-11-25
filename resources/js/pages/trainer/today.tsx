import { Head, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import HomeView from '@/components/trainer/home/home-view';
import type { HomeProps } from '@/components/trainer/home/types';
import { useRequestAnswer } from '@/components/trainer/home/use-request-answer';
import { addHours } from '@/lib/format';
import { today as todayPage } from '@/routes/trainer';
import type { TrainerStatsPeriod } from '@/types';

/** The props a change of day reloads. */
const DAY_PROPS = ['day', 'week', 'daySessions', 'next'];

/**
 * "Oggi" of the trainer: the requests to confirm (what "Richieste" was in
 * the menu) and the overview of the day (home-view.tsx).
 */
export default function Today(props: HomeProps) {
    const [now] = useState(() => new Date());
    const { busyId, answer } = useRequestAnswer([
        'requests',
        'week',
        'daySessions',
        'next',
    ]);
    // The first session of today not over yet is open at first.
    const nextId = useMemo(() => {
        if (props.day !== props.today) {
            return null;
        }

        return (
            props.daySessions.find(
                (session) =>
                    session.kind === 'confirmed' &&
                    new Date(addHours(session.start, session.hours)) > now,
            )?.id ?? null
        );
    }, [props.day, props.today, props.daySessions, now]);
    const [openId, setOpenId] = useState<number | null>(nextId);

    // `?giorno=` and `?periodo=` stay in the address: a reload keeps them.
    const query = (extra: Record<string, string | undefined>) => {
        const current = new URLSearchParams(window.location.search);
        const params: Record<string, string> = {};

        current.forEach((value, key) => {
            params[key] = value;
        });

        Object.entries(extra).forEach(([key, value]) => {
            if (value === undefined) {
                delete params[key];
            } else {
                params[key] = value;
            }
        });

        return params;
    };

    const pickDay = (date: string) => {
        router.get(
            todayPage.url({
                query: query({
                    giorno: date === props.today ? undefined : date,
                }),
            }),
            {},
            {
                only: DAY_PROPS,
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onSuccess: (page) => {
                    const sessions = (page.props as unknown as HomeProps)
                        .daySessions;
                    setOpenId(sessions[0]?.id ?? null);
                },
            },
        );
    };

    const changePeriod = (
        period: TrainerStatsPeriod,
        from?: string,
        to?: string,
    ) => {
        router.get(
            todayPage.url({
                query: query({
                    periodo: period === '7' ? undefined : period,
                    dal: period === 'intervallo' ? from : undefined,
                    al: period === 'intervallo' ? to : undefined,
                }),
            }),
            {},
            {
                only: ['stats'],
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const view = {
        ...props,
        now,
        busyId,
        onAnswer: answer,
        onPickDay: pickDay,
        onPeriod: changePeriod,
        openId,
        onToggle: (id: number) => setOpenId(openId === id ? null : id),
        nextId,
    };

    return (
        <>
            <Head title="Oggi" />
            <HomeView {...view} />
        </>
    );
}

Today.layout = { section: 'today' };
