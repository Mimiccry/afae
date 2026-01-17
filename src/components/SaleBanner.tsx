import { useState, useEffect } from "react";

const SaleBanner = () => {
  const [timeLeft, setTimeLeft] = useState("00:00:00");

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0); // 오늘 자정

      const diff = midnight.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("00:00:00");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const formattedTime = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
      setTimeLeft(formattedTime);
    };

    // 즉시 실행
    updateCountdown();

    // 1초마다 업데이트
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-red-500 text-white py-2 md:py-3">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-2 md:gap-4 text-sm md:text-base font-medium">
          <span>타임 세일</span>
          <span className="font-bold text-lg md:text-xl">{timeLeft}</span>
          <span>까지</span>
        </div>
      </div>
    </div>
  );
};

export default SaleBanner;


