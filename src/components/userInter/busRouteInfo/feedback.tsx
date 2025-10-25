import { useAuth } from "@/context/userContext";
import { Star } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";

export interface Review {
  userImage?: string;
  userName: string;
  time?: string;
  rating: number;
  comment?: string;
}

interface FeedbackProps {
    setAuthOpen: React.Dispatch<React.SetStateAction<boolean>>;
    routeName: string;
    ratingRoute: number;
}

export const Feedback = ({ setAuthOpen, routeName }: FeedbackProps) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/reviews/${routeName}`)
      .then((res) => res.json())
      .then((data) => setReviews(data))
      .catch(() => setReviews([]));
  }, [routeName]);

  const handleSubmit = async () => {
    if(!user) {
        setAuthOpen(true);
        return;
    }
    if (!rating) return;
    setLoading(true);

    const newReview: Review = {
      userImage: user?.photoURL || '',
      userName: user?.displayName || 'Anonymous',
      time: new Date().toLocaleDateString(),
      rating,
      comment: comment || '',
    };

    await fetch("/api/reviews/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ routeName, review: newReview }),
    });

    setReviews((prev) => [newReview, ...prev]);
    setComment("");
    setRating(0);
    setLoading(false);
  };

  const AvgRev = (reviews.reduce((acc, rev) => acc + rev.rating, 0) / (reviews.length || 1)).toFixed(1);

  return (
    <div className="flex flex-col gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
      <div className="flex flex-row items-center gap-2">
        <span className="text-2xl font-semibold text-gray-800">Reviews</span> 
        <span className="text-gray-500">-</span> 
        <div className="flex flex-row items-center gap-1"> 
            <span className="text-xl font-medium">{AvgRev}</span> 
            <Star fill="currentColor" className="w-4 h-4 text-yellow-400" />      
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-row items-center gap-1">
          {Array.from({ length: 5 }).map((_, idx) => (
            <button key={idx} onClick={() => setRating(idx + 1)} className="cursor-pointer">
              <Star
                className={`w-6 h-6 transition-colors ${
                  idx < rating ? "text-yellow-400" : "text-gray-300"
                }`}
                fill={idx < rating ? "currentColor" : "none"}
              />
            </button>
          ))}
        </div>
        <textarea
          placeholder="Add Your Experience"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="px-3 py-2 border bg-white border-gray-300 rounded-md resize-none w-full h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
        ></textarea>
        <button
          type="button"
          disabled={loading || !comment || !rating}
          onClick={handleSubmit}
          className="cursor-pointer py-2 px-3 border border-blue-400 rounded-lg text-lg flex flex-row gap-2 justify-center items-center transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-white text-blue-400 hover:bg-blue-400 hover:text-white"
        >
          {loading ? "Submitting..." : "Submit Feedback"}
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-lg font-medium text-gray-800">
          Total {reviews.length} Reviews
        </span>

        {reviews.map((review, i) => {
            const GuestPic = review?.userName.slice(0,2).toUpperCase();
         return(
          <div
            key={i}
            className="flex flex-col rounded-lg border border-gray-200 bg-white p-3 gap-2"
          >
            <div className="flex flex-row gap-2 items-center">
              {user?.photoURL ?
              <Image
                src={review?.userImage || ""}
                alt={review.userName || "User Image"}
                width={40}
                height={40}
                className="rounded-full bg-gray-200 shrink-0 w-10 h-10"
              />
              :
                <div className="rounded-full bg-gray-200 shrink-0 w-10 h-10 flex items-center justify-center text-lg text-gray-500">
                    {GuestPic}
                </div>
              }
              <div className="flex flex-col text-sm">
                <span className="font-medium text-gray-800">
                  {review.userName}
                </span>
                <span className="text-gray-500">{review.time}</span>
              </div>
              <div className="flex flex-row items-center ml-auto text-sm bg-gray-100 border border-gray-200 rounded-lg px-2 py-1 gap-1">
                {review.rating}
                <Star
                  fill="currentColor"
                  className="w-4 h-4 text-yellow-400"
                />
              </div>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {review.comment}
            </p>
          </div>
        )})}
      </div>
    </div>
  );
};
