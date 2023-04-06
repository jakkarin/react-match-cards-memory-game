import cards from '@/cards';
import { AnimatePresence, motion } from "framer-motion";
import _ from 'lodash';
import { nanoid } from 'nanoid';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Box, Button, Container, Flex, Image, SimpleGrid, Stack, useTimeout, useUpdateEffect } from '@chakra-ui/react';
import { useBoolean, useEffectOnce } from 'usehooks-ts';

import dayjs from 'dayjs';
import { useTimer } from 'react-timer-hook';
const delay = (ms: number) => new Promise(
    resolve => setTimeout(resolve, ms)
);

function useArray<T = any>(defaultValue: Array<T> = []) {
    const [array, setArray] = useState(defaultValue);

    return {
        items: array,
        clear: () => {
            setArray(() => []);
        },
        append: (item: T) => {
            setArray(prev => [...prev, item]);
        },
    };
};

function useCardArray(defaultValue: Array<ICard> = []) {
    const [array, setArray] = useState(defaultValue);

    const handleGet = (index: number) => {
        return array.at(index) as ICard;
    };

    return {
        items: array,
        at: handleGet,
        reset: () => {
            setArray((prev) => prev.map(item => ({ ...item, closed: false, matched: false })));
        },
        shuffle: () => {
            setArray((prev) => _.shuffle(prev));
        },
        openAll: () => {
            setArray((prev) => prev.map(item => ({ ...item, closed: false })));
        },
        closeAll: () => {
            setArray((prev) => prev.map(item => ({ ...item, closed: false })));
        },
        open: (index: number) => {
            setArray((prev) => {
                const item = prev.at(index);

                if (item) {
                    item.closed = false;
                    prev.splice(index, 1, item);
                }

                return prev.slice();
            });
        },
        close: (index: number) => {
            setArray((prev) => {
                const item = prev.at(index);

                if (item) {
                    item.closed = true;
                    prev.splice(index, 1, item);
                }

                return prev.slice();
            });
        },
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

const STATUS_INIT = 'init';
const STATUS_READY = 'ready';
const STATUS_CHECKING = 'checking';
const STATUS_FAILED = 'failed';
const STATUS_SUCCESS = 'success';

type ICard = {
    id: string;
    url: string;
    key: string;
    closed: boolean;
    matched: boolean;
};

type useMatchingGameOptions = {
    cards: Array<ICard>;
    maxAttempt?: number;
};

type useMatchingGameReturn = {
    items: Array<any>;
    status: string;
    attempt: number;
};

// function useMatchingGame(options: useMatchingGameOptions) {
//     const attempt = useNumber(0);

//     const opens = useArray<number>([]);
//     const items = useCardArray<ICard>([]);

//     const [status, setStatus] = useState(STATUS_INIT);

//     const handleTap = (index: number) => {
//         if (status === STATUS_READY) {
//             items.open(index);
//         }
//     };

//     const onInit = async () => {
//         await delay(400);

//         for (let i = 0; i < 10; i++) {
//             await delay(400);
//             items.shuffle();
//         }

//         await delay(6000);
//         handleCloseAll();
//         setStatus(STATUS_READY);
//     };

//     return {
//         status: status,
//         attempt: attempt,
//         onTap: () => {
//             if (status === STATUS_READY) {
//                 const item = list.at(index);

//                 if (item && !item.matched) {
//                     item.closed = !item.closed;
//                     setList(() => [...list]);
//                     active.append(index);
//                 }
//             }
//         }
//     };
// }

const LottiePlayerLose = () => {
    const ref = useRef<any>();

    const handleFrame = (e: any) => {
        const frame = Math.round(e.detail.frame);
        frame >= 55 && e.target.pause();
    };

    useEffectOnce(() => {
        const el = ref.current;
        el && el.addEventListener('frame', handleFrame);
        return () => {
            el && el.removeEventListener('frame', handleFrame);
        };
    });

    return (
        <Box pt={3}>
            <dotlottie-player
                ref={ref}
                src={import.meta.env.BASE_URL + 'bg/128600-lose-animation.lottie'}
                autoplay
                style={{ height: '100%', width: '100%' }}
            />
        </Box>
    );
};

function MyTimer(props: any) {
    const {
        seconds,
        pause,
    } = useTimer({
        expiryTimestamp: props.time,
        onExpire: () => props?.onEnd?.(),
    });

    useUpdateEffect(() => {
        props.status === STATUS_SUCCESS && pause();
    }, [props.status]);

    return <span>{seconds}</span>;
}

function App() {
    const isReady = useBoolean();

    const active = useArray<number>([]);
    const [turn, setTurn] = useState(0);
    const [time, setTime] = useState<any>(null);

    const [status, setStatus] = useState(STATUS_INIT);

    const init = useCallback(() => {
        return _.shuffle([...cards, ...cards].map(v => ({
            ...v,
            key: nanoid(),
            closed: false,
            matched: false,
        })));
    }, []);

    const [list, setList] = useState(init);

    const handleOpenAll = () => {
        setList((list) => list.map(item => ({ ...item, closed: false })));
    };

    const handleCloseAll = () => {
        setList((list) => list.map(item => ({ ...item, closed: true })));
    };

    const handleCheck = async () => {
        await delay(500);

        const f = list.at(active.items[0]);
        const s = list.at(active.items[1]);

        if (f && s) {
            if (f.id === s.id) {
                f.matched = true;
                s.matched = true;
                f.closed = false;
                s.closed = false;
            } else {
                f.matched = false;
                f.closed = true;
                s.matched = false;
                s.closed = true;
            }
        }

        active.clear();
        setTurn((prev) => prev + 1);
        setList((prev) => prev.slice());
        setStatus(() => STATUS_READY);
    };

    const initAnimation = async () => {
        // await delay(1000);
        // handleOpenAll();
        await delay(400);
        for (let i = 0; i < 10; i++) {
            await delay(400);
            setList((list) => _.shuffle(list));
        }
        await delay(4000);
        handleCloseAll();
        setStatus(STATUS_READY);
        setTime(dayjs().add(45, 'seconds').toDate());
    };

    const handleRestart = () => {
        setTurn(0);
        setList(init());
        handleOpenAll();
        active.clear();
        setStatus('init');
    };

    const handleTap = (index: number) => {
        if (status === STATUS_READY) {
            const item = list.at(index);

            if (item && !item.matched && !active.items.includes(index)) {
                item.closed = !item.closed;
                setList(() => [...list]);
                active.append(index);
            }
        }
    };

    useEffect(() => {
        if (active.items.length >= 2) {
            setStatus(STATUS_CHECKING);
        }
    }, [active]);

    useEffect(() => {
        console.log('matched', list.every(v => v.matched));
        if (list.every(v => v.matched)) {
            setStatus(STATUS_SUCCESS);
        }
    }, [list]);

    useEffect(() => {
        if (isReady.value) {
            if (status === 'init') {
                initAnimation();
            } else if (status === STATUS_READY) {
                //
            } else if (status === STATUS_CHECKING) {
                handleCheck();
            } else if (status === STATUS_SUCCESS) {

            }
        }
    }, [status, isReady.value]);

    useTimeout(isReady.setTrue, 1000);

    return (
        <Container pt={3}>
            <Flex gap={3}>
                <Button onClick={() => setList(_.shuffle(list))}>Suffle</Button>
                <Button onClick={handleRestart}>Restart</Button>
            </Flex>

            <Box pt={3}>
                <Box>
                    Turn: {turn}
                </Box>
                <Box>
                    Status: {status}
                </Box>

                {status !== STATUS_INIT && (
                    <Box>
                        Timer: <MyTimer time={time} status={status} onEnd={() => setStatus(STATUS_FAILED)} />
                    </Box>
                )}
            </Box>

            <Box pos="relative">
                <AnimatePresence>
                    <SimpleGrid columns={3} spacing={1}>
                        {list.map((item, index) => (
                            <motion.div
                                layout
                                key={item.key}
                                initial={{
                                    scale: 0,
                                }}
                                animate={{
                                    scale: 1,
                                    transition: { delay: 0.5, type: "spring" },
                                }}
                                exit={{
                                    opacity: 0,
                                    transition: { delay: 0.5 },
                                }}
                            >
                                <Box
                                    position="relative"
                                    maxW={400}
                                    maxH={400}
                                    border={1}
                                    borderStyle="solid"
                                    borderColor="gray.100"
                                    bg="white"
                                    style={{
                                        transition: 'transform 0.4s',
                                        transformStyle: 'preserve-3d',
                                        transform: item.closed ? 'rotateY(180deg)' : 'rotateY(0deg)',
                                    }}
                                    onClick={() => handleTap(index)}
                                >
                                    <Box
                                        p={3}
                                        style={{
                                            backfaceVisibility: 'hidden',
                                            WebkitBackfaceVisibility: 'hidden',
                                        }}
                                    >
                                        <Image src={item.url} maxW="full" />
                                    </Box>
                                    <Box
                                        position="absolute"
                                        top={0}
                                        left={0}
                                        w="full"
                                        h="full"
                                        bg="black"
                                        style={{
                                            transform: 'rotateY(180deg)',
                                            backfaceVisibility: 'hidden',
                                            WebkitBackfaceVisibility: 'hidden',
                                        }}
                                    >
                                        <Image src={import.meta.env.BASE_URL + 'bg/card.jpg'} maxW="full" />
                                    </Box>
                                </Box>
                            </motion.div>
                        ))}
                    </SimpleGrid >
                </AnimatePresence>

                {status === STATUS_SUCCESS && (
                    <Box position="absolute" top={0} left={0} w="full" h="full">
                        <dotlottie-player src={import.meta.env.BASE_URL + 'bg/119925-congrats.lottie'} autoplay style={{ height: '100%', width: '100%' }} />
                    </Box>
                )}
            </Box>

            <Stack py={3} spacing={0}>
                <span>Image by <a href="https://www.freepik.com/free-vector/zoom-effect-background_32375312.htm#query=anime%20pattern&position=22&from_view=search&track=ais">Freepik</a></span>
                <span><a href="https://www.freepik.com/free-vector/kawaii-character-collection_4176261.htm#query=anime%20chibi&position=37&from_view=keyword&track=ais">Image by pikisuperstar</a> on Freepik</span>
            </Stack>

            {status === STATUS_FAILED && (
                <Box position="fixed" top={0} left={0} w="full" h="full" bg="blackAlpha.800">
                    <LottiePlayerLose />
                    <center>
                        <Button size="lg" onClick={handleRestart}>RESTART</Button>
                    </center>
                </Box>
            )}
        </Container >
    );
}

export default App;
