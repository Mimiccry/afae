import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  const faqItems = [
    {
      question: "배송은 얼마나 걸리나요?",
      answer:
        "주문하신 상품은 평일 기준 3-5일 이내에 배송됩니다. 배송지에 따라 차이가 있을 수 있으며, 제품 준비가 필요한 경우 추가 시간이 소요될 수 있습니다.",
    },
    {
      question: "교환 및 환불이 가능한가요?",
      answer:
        "제품 수령 후 7일 이내에 교환 및 환불이 가능합니다. 단, 제품의 하자가 없는 경우 왕복 배송비는 고객 부담입니다. 제품에 문제가 있는 경우 배송비는 무료로 처리됩니다.",
    },
    {
      question: "할인 혜택은 어떻게 받을 수 있나요?",
      answer:
        "신규 회원가입 시 5% 할인 쿠폰을 지급해드립니다. 또한 이벤트 기간 중 추가 할인 혜택을 제공하며, 할인 쿠폰은 장바구니에서 사용하실 수 있습니다.",
    },
  ];

  return (
    <section className="py-12 md:py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground text-center mb-10 md:mb-14">
            자주 묻는 질문
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQ;


