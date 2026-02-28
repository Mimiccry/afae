import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { scrollToHash as scrollToHashUtil } from "@/lib/scrollToHash";

/**
 * 페이지 변경 시 상단으로 스크롤하는 컴포넌트
 * 해시 링크(#anchor)가 있는 경우 해당 요소로, 없으면 상단으로 스크롤합니다.
 */
const ScrollToHash = () => {
  const location = useLocation();

  useEffect(() => {
    // URL에 해시가 있는 경우 해당 요소로 부드럽게 스크롤
    if (location.hash) {
      scrollToHashUtil(location.hash);
    } else {
      // 해시가 없으면 상단으로 스크롤
      window.scrollTo({
        top: 0,
        behavior: "instant", // 즉시 이동 (부드러운 애니메이션 없음)
      });
    }
  }, [location.pathname, location.hash]); // pathname과 hash 변경 시 실행

  return null;
};

export default ScrollToHash;
