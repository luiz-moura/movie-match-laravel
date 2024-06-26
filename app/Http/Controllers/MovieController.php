<?php

namespace App\Http\Controllers;

use App\Events\SwipeMovie;
use App\Http\Controllers\Controller;
use App\Http\Requests\IndexMovieRequest;
use App\Http\Requests\StoreMovieRequest;
use App\Repositories\RoomMovieRepository;
use App\Repositories\RoomRepository;
use App\Services\MovieApiService;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class MovieController extends Controller
{
    public function __construct(
        private RoomRepository $roomRepository,
        private RoomMovieRepository $roomMovieRepository,
        private MovieApiService $movieApiService,
    ) {
    }

    public function index(IndexMovieRequest $request)
    {
        $page = $request->validated()['page'];

        $movies = $this->movieApiService->getMovies($page, 'popular');

        return response()->json($movies);
    }

    public function swipe(StoreMovieRequest $request)
    {
        $validatedRequest = $request->validated();

        $room = $this->roomRepository->findById($validatedRequest['room_id']);
        if (!$room) {
            throw new NotFoundHttpException();
        }

        if ($room['finished_at']) {
            return response()->noContent();
        }

        $match = false;
        if ('right' === $validatedRequest['direction']) {
            $match = $this->roomMovieRepository->checksMachByRoomIdAndMovieId($room['id'], $validatedRequest['movie_id']);
        }

        if ($match) {
            $movie = $this->movieApiService->findById($validatedRequest['movie_id']);
            SwipeMovie::dispatch($room['key'], $movie);
            $this->roomRepository->finishRoomById($room['id']);
        }

        $this->roomMovieRepository->create([
            'room_id' => $room['id'],
            'movie_id' => $validatedRequest['movie_id'],
            'direction' => $validatedRequest['direction'],
            'match' => $match,
        ]);

        if ($match) {
            return response()->noContent();
        }
    }
}
