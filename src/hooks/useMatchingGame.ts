import _ from 'lodash';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useTimeout, useUpdateEffect } from '@chakra-ui/react';
import { useBoolean, useIsMounted, useEffectOnce } from 'usehooks-ts';

import dayjs from 'dayjs';

export const STATUS_INIT = 0;
export const STATUS_READY = 1;
export const STATUS_CHECKING = 2;
export const STATUS_SUCCESS = 3;
export const STATUS_FAILED = 4;

export type ICard = {
    id: string;
    url: string;
    key: string;
    closed: boolean;
    matched: boolean;
};

export type useMatchingGameOptions = {
    cards: Array<ICard>;
    maxAttempt?: number;
    seconds: number;
};

export type useMatchingGameReturn = {
    items: Array<any>;
    status: number;
    attempt: number;
    exipresAt: Date,
    onTap: (index: any) => void,
    onTimeIsUp: () => void,
    onRestart: () => void,
};

const delay = (ms: number) => new Promise(
    resolve => setTimeout(resolve, ms)
);

function useOpenedArrayRef(defaultValue: Array<number> = []) {
    const array = useRef(defaultValue);

    return useMemo(() => ({
        items: () => array.current,
        clear: () => {
            array.current = [];
        },
        append: (item: number) => {
            array.current.push(item);
        },
        includes: (item: number) => {
            return array.current.includes(item);
        },
        length: () => {
            return array.current.length;
        },
        match: (check: string[]) => {
            const [a, b] = array.current;
            const [x, y] = [check.at(a), check.at(b)];
            return Boolean(x && y && x === y);
        },
    }), []);
};

function useCardArray(defaultValue: Array<ICard> = []) {
    const [data, setData] = useState(defaultValue);

    const handleGet = (index: number) => {
        return data.at(index) as ICard;
    };

    return {
        data: data,
        at: handleGet,
        reset: () => {
            setData((prev) => prev.map(item => ({ ...item, closed: false, matched: false })));
        },
        replace: (index: number, item: ICard) => setData((prev) => {
            prev.splice(index, 1, item);
            return prev.slice();
        }),
        shuffle: () => {
            setData((prev) => _.shuffle(prev));
        },
        openAll: () => {
            setData((prev) => prev.map(item => ({ ...item, closed: false })));
        },
        closeAll: () => {
            setData((prev) => prev.map(item => ({ ...item, closed: true })));
        },
        open: (...indexes: number[]) => setData((prev) => {
            indexes.map((index) => prev.at(index) as ICard)
                .filter((item) => Boolean(item))
                .forEach((item) => (item.closed = false));
            return prev.slice();
        }),
        close: (...indexes: number[]) => setData((prev) => {
            indexes.map((index) => prev.at(index) as ICard)
                .filter((item) => Boolean(item))
                .forEach((item) => (item.closed = true));
            return prev.slice();
        }),
        keys: () => {
            return data.map(r => r.id);
        },
        matched: (...indexes: number[]) => setData((prev) => {
            indexes.map((index) => prev.at(index) as ICard)
                .filter((item) => Boolean(item))
                .forEach((item) => (item.matched = true));
            return prev.slice();
        }),
    };
};

function useNumber(defaultValue: number = 0) {
    const [value, setValue] = useState(defaultValue);

    return {
        value: value,
        clear: () => {
            setValue(defaultValue);
        },
        increment: () => {
            setValue(value + 1);
        },
        decrement: () => {
            setValue(value - 1);
        },
    };
};


function useMatchingGame(options: useMatchingGameOptions): useMatchingGameReturn {
    const isMounted = useIsMounted();
    const statusRef = useRef<number>(STATUS_INIT);

    const attempt = useNumber(0);
    const isReady = useBoolean();

    const opens = useOpenedArrayRef([]);
    const items = useCardArray(options.cards);

    const [status, setStatus] = useState(STATUS_INIT);
    const [exipresAt, setExipresAt] = useState<any>(null);

    const onInit = async () => {
        if (isMounted()) {
            attempt.clear();
            items.closeAll();
            items.reset();
        }

        await delay(400);

        if (isMounted()) {
            items.openAll();
            setStatus(() => STATUS_INIT);
        }

        await delay(400);

        for (let i = 0; i < 10; i++) {
            await delay(400);
            isMounted() && items.shuffle();
        }

        await delay(4000);

        if (isMounted()) {
            items.closeAll();
            setExipresAt(() => dayjs().add(options.seconds, 'seconds').toDate());
            setStatus(() => STATUS_READY);
        }
    };

    const handleTap = (index: number) => {
        if (statusRef.current === STATUS_READY) {
            const item = {
                ...items.at(index),
            };

            if (item && item.closed && !item.matched && !opens.includes(index)) {
                items.open(index);
                opens.append(index);
            }

            opens.length() >= 2 && setStatus(() => STATUS_CHECKING);
        }
    };

    const handleCheck = async () => {
        await delay(500);

        const indexes = opens.items();

        if (opens.match(items.keys())) {
            items.matched(...indexes);
        } else {
            items.close(...indexes);
        };

        opens.clear();
        attempt.increment();
        setStatus(() => STATUS_READY);
    };

    const handleTimeIsUp = () => {
        if (statusRef.current < STATUS_SUCCESS) {
            setStatus(() => STATUS_FAILED);
        }
    };

    useUpdateEffect(() => {
        if (items.data.every(v => v.matched)) {
            setStatus(STATUS_SUCCESS);
        }
    }, [items.data]);

    useUpdateEffect(() => {
        statusRef.current = status;

        if (status === STATUS_CHECKING) {
            handleCheck();
        }
    }, [status]);

    useEffectOnce(() => {
        const timeout = setTimeout(() => {
            onInit();
            isReady.setTrue();
        }, 1000);
        return () => clearTimeout(timeout);
    });

    return {
        items: items.data,
        status: status,
        attempt: attempt.value,
        exipresAt: exipresAt,
        onTap: handleTap,
        onTimeIsUp: handleTimeIsUp,
        onRestart: onInit,
    };
}

export default useMatchingGame;