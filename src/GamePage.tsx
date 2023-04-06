import { AnimatePresence, motion } from "framer-motion";
import { nanoid } from 'nanoid';
import { useMemo, useRef } from 'react';

import { Box, Button, Container, Flex, Image, Modal, ModalBody, ModalContent, ModalOverlay, SimpleGrid, Stack, useTimeout, useUpdateEffect } from '@chakra-ui/react';

import { useTimer } from 'react-timer-hook';
import { useBoolean, useEffectOnce } from "usehooks-ts";
import useMatchingGame, { STATUS_FAILED, STATUS_INIT, STATUS_SUCCESS } from './hooks/useMatchingGame';

const _CARDS = [
    {
        id: '1',
        url: import.meta.env.BASE_URL + 'cards/1.jpg',
    },
    {
        id: '2',
        url: import.meta.env.BASE_URL + 'cards/2.jpg',
    },
    {
        id: '3',
        url: import.meta.env.BASE_URL + 'cards/3.jpg',
    },
    {
        id: '4',
        url: import.meta.env.BASE_URL + 'cards/4.jpg',
    },
    {
        id: '5',
        url: import.meta.env.BASE_URL + 'cards/5.jpg',
    },
    {
        id: '6',
        url: import.meta.env.BASE_URL + 'cards/6.jpg',
    },
];

function TimerRunning(props: any) {
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

function Timer(props: any) {
    if (props.status === STATUS_INIT) {
        return <>59</>;
    }
    return <TimerRunning {...props} />;
}

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

const SuccessModal = (props: any) => {
    const show = useBoolean();

    useTimeout(show.setTrue, 1000);

    return (
        <Modal isOpen={show.value} onClose={() => { }} isCentered>
            <ModalOverlay />
            <ModalContent maxW="fit-content">
                <ModalBody p={3}>
                    <Button size="lg" onClick={props.onRestart} colorScheme="blue">RESTART</Button>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

const GamePage = () => {
    const cards = useMemo(() => {
        const arr = [
            ..._CARDS,
            ..._CARDS,
        ];
        return arr.map(item => ({ ...item, key: nanoid(), closed: false, matched: false }));
    }, []);

    const {
        items,
        attempt,
        status,
        onTap,
        exipresAt,
        onTimeIsUp,
        onRestart,
    } = useMatchingGame({
        cards: cards,
        seconds: 59,
    });

    return (
        <Container>
            <Box pt={3} fontSize="lg" textAlign="center">
                Count: {attempt}
            </Box>

            <Box pb={3} fontSize="3xl" textAlign="center">
                Countdown: <Timer time={exipresAt} status={status} onEnd={onTimeIsUp} />
            </Box>

            <Box pos="relative">
                <AnimatePresence>
                    <SimpleGrid columns={3} spacing={1}>
                        {items.map((item, index) => (
                            <motion.div
                                key={item.key}
                                layout
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
                                    onClick={() => onTap(index)}
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

            {status === STATUS_FAILED && (
                <Box position="fixed" top={0} left={0} w="full" h="full" bg="blackAlpha.900">
                    <Box position="relative" top={0} left={0} w="full" h="full">
                        <LottiePlayerLose />
                        <Flex pos="absolute" top={0} left={0} w="full" h="full" alignItems="center" justifyContent="center">
                            <center>
                                <Box p={3} bg="white" w="fit-content" rounded="md">
                                    <Button size="lg" onClick={onRestart} colorScheme="blue">RESTART</Button>
                                </Box>
                            </center>
                        </Flex>
                    </Box>
                </Box>
            )}

            <Stack py={3} spacing={0}>
                <span>Image by <a href="https://www.freepik.com/free-vector/zoom-effect-background_32375312.htm#query=anime%20pattern&position=22&from_view=search&track=ais">Freepik</a></span>
                <span><a href="https://www.freepik.com/free-vector/kawaii-character-collection_4176261.htm#query=anime%20chibi&position=37&from_view=keyword&track=ais">Image by pikisuperstar</a> on Freepik</span>
            </Stack>

            {status === STATUS_SUCCESS && <SuccessModal onRestart={onRestart} />}
        </Container>
    );
};

export default GamePage;