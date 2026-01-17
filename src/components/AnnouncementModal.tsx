import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const ANNOUNCEMENT_COOKIE_KEY = "announcement_dismissed_until";

const AnnouncementModal = () => {
  const [open, setOpen] = useState(false);
  const [dontShowToday, setDontShowToday] = useState(false);

  useEffect(() => {
    // 쿠키 확인
    const dismissedUntil = Cookies.get(ANNOUNCEMENT_COOKIE_KEY);
    if (dismissedUntil) {
      const dismissedDate = new Date(dismissedUntil);
      const now = new Date();
      // 쿠키에 저장된 날짜가 아직 지나지 않았으면 모달을 표시하지 않음
      if (dismissedDate > now) {
        return;
      }
      // 쿠키가 만료되었으면 쿠키 삭제
      Cookies.remove(ANNOUNCEMENT_COOKIE_KEY);
    }
    // 쿠키가 없거나 만료되었으면 모달 표시
    setOpen(true);
  }, []);

  const handleClose = () => {
    if (dontShowToday) {
      // 하루 동안 보지 않기: 현재 시간 + 24시간
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0); // 자정으로 설정
      Cookies.set(ANNOUNCEMENT_COOKIE_KEY, tomorrow.toISOString(), {
        expires: 1, // 1일
      });
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        handleClose();
      }
    }}>
      <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            오픈 기념 세일
          </DialogTitle>
          <DialogDescription className="text-center pt-4">
            레츠고 오픈을 기념하여 특별한 할인 혜택을 준비했습니다!
            <br />
            다양한 가구를 특가에 만나보세요.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2 pt-4">
          <Checkbox
            id="dont-show-today"
            checked={dontShowToday}
            onCheckedChange={(checked) => setDontShowToday(checked as boolean)}
          />
          <Label
            htmlFor="dont-show-today"
            className="text-sm font-normal cursor-pointer"
          >
            오늘 하루 보지 않기
          </Label>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AnnouncementModal;
