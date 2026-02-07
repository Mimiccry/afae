import { Helmet } from "react-helmet-async";
import Layout from "@/components/Layout";
import HeroBanner from "@/components/HeroBanner";
import ProductList from "@/components/ProductList";
import FAQ from "@/components/FAQ";
import AnnouncementModal from "@/components/AnnouncementModal";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Let's Go - 따뜻한 집으로의 출발</title>
        <meta
          name="description"
          content="레츠고 가구 쇼핑몰에서 따뜻하고 아늑한 가구들을 만나보세요. 모듈 소파, 원목 식탁, 인테리어 조명 등 다양한 가구를 합리적인 가격에 제공합니다."
        />
      </Helmet>
      <Layout>
        <AnnouncementModal />
        <HeroBanner />
        <ProductList />
        <FAQ />
      </Layout>
    </>
  );
};

export default Index;
