export type ShowTimeStatus = "DRAFT" | "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED" | "FULLY_BOOKED";
export type SeatShowTimeStatus = "AVAILABLE" | "RESERVED" | "SOLD" | "BLOCKED";

export interface Showtime {
    showTimeId: number;
    startTime: string;
    endTime: string;
    showTimeStatus: ShowTimeStatus;

    movieId: number;
    movieTitle: string;
    movieDuration: number;
    moviePosterUrl: string;
    movieStatus: string;

    roomId: number;
    roomName: string;
    roomType: string;

    cinemaId: number;
    cinemaName: string;

    prices: ShowtimePrice[];
}

export interface ShowtimeDetail {
    showTimeId: number;
    startTime: string;
    endTime: string;
    showTimeStatus: string;

    movies: {
        movieId: number;
        title: string;
        duration: number;
        posterUrl: string;
    };
    rooms: {
        roomId: number;
        name: string;
        cinemas: {
            cinemaId: number;
            name: string;
        }
    };
    prices: ShowtimePrice[];
    seatSummary: any;
}

export interface ShowtimePrice {
    id: number;
    price: number;
    seatType: string;
    dayType: string;
    timeType: string;
}

export interface SeatSelectionData {
    showTimeId: number;
    seats: SeatShowtimeItem[];
}

export interface SeatShowtimeItem {
    id: number;
    seatId: number;
    seatName: string;
    seatType: string;
    seatRow: string;
    seatColumn: number;
    price: number;
    status: SeatShowTimeStatus;
}

export interface ProposalMovieCountAssignment {
    movieId: number;
    count: number;
}

export interface ProposalRoomPlan {
    roomId: number;
    assignments: ProposalMovieCountAssignment[];
}

export interface ShowTimeProposalOverrideItem {
    movieId: number;
    roomId: number;
    startTime: string;
    endTime: string;
}

export interface ShowTimeProposalRequest {
    cinemaId: number;
    fromDate: string; // yyyy-MM-dd
    toDate: string; // yyyy-MM-dd
    openTime: string; // HH:mm
    closeTime: string; // HH:mm
    roomPlans: ProposalRoomPlan[];
    dryRun: boolean;
    /** Khi có: admin đã kéo-thả chỉnh tay trong Preview — ghi thẳng, không tính lại thuật toán. */
    overrideShowtimes?: ShowTimeProposalOverrideItem[];
}

export interface ShowTimeProposalShortfall {
    roomId: number;
    roomName: string;
    movieId: number;
    movieTitle: string;
    date: string;
    missingCount: number;
}

export interface ShowTimeProposalResult {
    created: Showtime[];
    shortfalls: ShowTimeProposalShortfall[];
}