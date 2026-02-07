/**
 * 해시 링크(#anchor)를 클릭했을 때 해당 요소로 부드럽게 스크롤하는 유틸리티 함수
 * @param hash - 이동할 요소의 ID (예: "#products")
 */
export const scrollToHash = (hash: string) => {
  if (!hash) return;

  // hash가 #으로 시작하지 않으면 추가
  const targetHash = hash.startsWith("#") ? hash : `#${hash}`;

  setTimeout(() => {
    const element = document.querySelector(targetHash);
    if (element) {
      // 네비게이션 바 높이를 고려한 오프셋
      const navbarHeight = 80; // md:h-20 = 80px
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  }, 100);
};


