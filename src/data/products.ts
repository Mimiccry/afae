import sofaImg from "@/assets/products/sofa.jpg";
import tableImg from "@/assets/products/table.png";
import storageImg from "@/assets/products/storage.jpg";
import lampImg from "@/assets/products/lamp.jpg";
import sideTableImg from "@/assets/products/sidetable.jpg";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  badge?: "SALE" | "NEW";
}

export const products: Product[] = [
  {
    id: "1",
    name: "모듈 소파",
    description: "내 공간에 맞춰 자유롭게 조립하고, 구름처럼 따뜻하게 몸을 감싸는 휴식의 중심",
    price: 1890000,
    image: sofaImg,
    category: "거실",
    badge: "SALE",
  },
  {
    id: "2",
    name: "원목 식탁",
    description: "결이 고운 나무 위에 매일의 온기를 담아내는, 우리 가족의 가장 다정한 대화 창구",
    price: 980000,
    image: tableImg,
    category: "다이닝",
    badge: "NEW",
  },
  {
    id: "3",
    name: "시스템 수납장",
    description: "복잡한 짐은 깔끔하게 비우고, 나만의 취향만 예쁘게 채워넣는 영리한 공간 활용",
    price: 720000,
    image: storageImg,
    category: "수납",
  },
  {
    id: "4",
    name: "인테리어 조명",
    description: "차가운 방 안을 한순간에 아늑한 영화 속 장면으로 바꿔주는 마법 같은 빛 한 방울",
    price: 289000,
    image: lampImg,
    category: "조명",
    badge: "NEW",
  },
  {
    id: "5",
    name: "디자인 사이드 테이블",
    description: "어느 곳에 두어도 당신의 동선을 따라 안락함을 완성하는, 작지만 가장 완벽한 곁",
    price: 189000,
    image: sideTableImg,
    category: "테이블",
    badge: "SALE",
  },
];

export const getProductById = (id: string): Product | undefined => {
  return products.find((product) => product.id === id);
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(price);
};
