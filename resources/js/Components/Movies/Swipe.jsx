import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import apiClient from '@/api'
import ActionButton from '@/Components/Movies/ActionButton'
import Card from '@/Components/Movies/Card'
import Match from '@/Components/Movies/Match'
import { useMoviesContext } from '@/Contexts/MoviesContext'
import { useRoomContext } from '@/Contexts/RoomContext'

export default function Swipe({ match }) {
    const room = useRoomContext()
    const [movies, setMovies] = useMoviesContext()

    const [isDragging, setIsDragging] = useState(false)
    const [isDragOffBoundary, setIsDragOffBoundary] = useState(null)
    const [cardDrivenProps, setCardDrivenProps] = useState({
        leftButtonScale: 1,
        rightButtonScale: 1,
    })

    const easeOutExpo = [0.16, 1, 0.3, 1]
    const variants = {
        current: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { duration: 0.3, ease: easeOutExpo },
        },
        upcoming: {
            opacity: 0.3,
            y: 0,
            scale: 1,
            transition: { duration: 0.3, ease: easeOutExpo, delay: 0 },
        },
        remainings: {
            opacity: 0,
            y: 0,
            scale: 1,
        },
        exit: {
            opacity: 0,
            y: 40,
            transition: { duration: 0.3, ease: easeOutExpo },
            x: isDragOffBoundary === 'left' ? -300 : 300,
            rotate: isDragOffBoundary === 'left' ? -20 : 20,
        },
    }

    const handleSwipe = (direction) => {
        setMovies(movies.slice(0, -1))

        apiClient.post('/api/movie/swipe', {
            direction,
            movie_id: movies.at(-1).id,
            room_id: room.id,
        })
    }

    const handleSwipeButton = async (direction) => {
        setIsDragOffBoundary(direction)
        setTimeout(() => {
            handleSwipe(direction)
            setIsDragOffBoundary(null)
        }, 5)
    }

    return (
        <motion.div className={`flex p-5 flex-col justify-center items-center ${isDragging ? 'cursor-grabbing' : ''}`}>
            <div className='w-full aspect-[100/150] max-w-xs mb-[20px] relative z-10'>
                <AnimatePresence>
                    {match && <Match movie={match} />}

                    {(!match && !!movies) && movies.map((movie, i) => {
                        const isLast = i === movies.length - 1
                        const isUpcoming = i === movies.length - 2

                        return (
                            <motion.div
                                key={movie.id}
                                className={'relative'}
                                variants={variants}
                                initial='remainings'
                                animate={isLast ? 'current' : isUpcoming ? 'upcoming' : 'remainings'}
                                exit='exit'
                            >
                                <Card
                                    movie={movie}
                                    isDragging={isDragging}
                                    setIsDragging={setIsDragging}
                                    setIsDragOffBoundary={setIsDragOffBoundary}
                                    setCardDrivenProps={setCardDrivenProps}
                                    handleSwipe={handleSwipe}
                                />
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            </div>

            {!match ? (
                <div className='flex items-center justify-center w-full gap-4 relative z-10 mt-6'>
                    <ActionButton
                        direction={'left'}
                        scale={cardDrivenProps.leftButtonScale}
                        isDragOffBoundary={isDragOffBoundary}
                        handleSwipe={() => handleSwipeButton('left')}
                    />
                    <ActionButton
                        direction={'right'}
                        scale={cardDrivenProps.rightButtonScale}
                        isDragOffBoundary={isDragOffBoundary}
                        handleSwipe={() => handleSwipeButton('right')}
                    />
                </div>
            ) : ''}
        </motion.div>
    )
}
