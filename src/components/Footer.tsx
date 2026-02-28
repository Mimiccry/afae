import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-10 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* 브랜드 */}
          <div>
            <Link to="/" className="text-2xl font-bold text-foreground">
              Let's Go
            </Link>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              따뜻한 집으로의 출발,
              <br />
              당신의 공간에 온기를 더합니다.
            </p>
          </div>

          {/* 고객센터 */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">고객센터</h3>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>1588-0000</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>help@letsgo.co.kr</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5" />
                <span>서울시 강남구 테헤란로 123</span>
              </li>
            </ul>
          </div>

          {/* 운영시간 */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">운영시간</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>평일: 09:00 - 18:00</li>
              <li>토요일: 09:00 - 13:00</li>
              <li>일요일/공휴일: 휴무</li>
            </ul>
          </div>
        </div>

        {/* 하단 */}
        <div className="mt-10 pt-6 border-t border-border text-center text-sm text-muted-foreground">
          <p>© 2024 Let's Go. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
