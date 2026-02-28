import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/lib/supabase";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "react-hot-toast";
import { Loader2, Mail, Edit, Receipt, Calendar } from "lucide-react";
import { User } from "@supabase/supabase-js";

const profileSchema = z.object({
  email: z.string().email("올바른 이메일 주소를 입력해주세요."),
});

const passwordSchema = z
  .object({
    newPassword: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["confirmPassword"],
  });

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  items: any[];
}

const MyPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      email: "",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { user: currentUser },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          toast.error("사용자 정보를 불러오는 중 오류가 발생했습니다.");
          navigate("/");
          return;
        }

        if (!currentUser) {
          toast.error("로그인이 필요합니다.");
          navigate("/signin");
          return;
        }

        setUser(currentUser);
        profileForm.setValue("email", currentUser.email || "");
      } catch (error) {
        toast.error("예상치 못한 오류가 발생했습니다.");
        console.error("Get user error:", error);
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [navigate, profileForm]);

  const fetchOrders = async () => {
    if (!user) return;

    setIsLoadingOrders(true);
    try {
      // orders 테이블에서 현재 사용자의 주문 내역 가져오기
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Orders fetch error:", error);
        // 테이블이 없을 수 있으므로 에러를 표시하지 않고 빈 배열로 설정
        setOrders([]);
        return;
      }

      setOrders(data || []);
    } catch (error) {
      console.error("Orders fetch error:", error);
      setOrders([]);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const onProfileSubmit = async (values: ProfileFormValues) => {
    if (!user) return;

    setIsUpdatingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: values.email,
      });

      if (error) {
        toast.error(error.message || "이메일 변경 중 오류가 발생했습니다.");
        return;
      }

      toast.success("이메일이 변경되었습니다. 새 이메일에서 확인 링크를 클릭해주세요.");
      
      // 사용자 정보 다시 가져오기
      const {
        data: { user: updatedUser },
      } = await supabase.auth.getUser();
      if (updatedUser) {
        setUser(updatedUser);
        profileForm.setValue("email", updatedUser.email || "");
      }
    } catch (error) {
      toast.error("예상치 못한 오류가 발생했습니다.");
      console.error("Update email error:", error);
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const onPasswordSubmit = async (values: PasswordFormValues) => {
    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.newPassword,
      });

      if (error) {
        toast.error(error.message || "비밀번호 변경 중 오류가 발생했습니다.");
        return;
      }

      toast.success("비밀번호가 변경되었습니다.");
      passwordForm.reset();
    } catch (error) {
      toast.error("예상치 못한 오류가 발생했습니다.");
      console.error("Update password error:", error);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Helmet>
        <title>마이페이지 - Let's Go</title>
        <meta name="description" content="Let's Go 마이페이지" />
      </Helmet>
      <Layout>
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold mb-2">마이페이지</h1>
              <p className="text-muted-foreground">내 정보를 관리하고 주문 내역을 확인하세요</p>
            </div>

            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="profile">회원 정보</TabsTrigger>
                <TabsTrigger value="orders" onClick={fetchOrders}>
                  결제 내역
                </TabsTrigger>
              </TabsList>

              {/* 회원 정보 탭 */}
              <TabsContent value="profile" className="space-y-6">
                <div className="rounded-lg border bg-card p-6 shadow-sm space-y-6">
                  {/* 현재 이메일 표시 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      현재 이메일
                    </div>
                    <div className="text-lg font-semibold">{user?.email}</div>
                  </div>

                  {/* 이메일 변경 */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Edit className="w-5 h-5" />
                      이메일 변경
                    </h3>
                    <Form {...profileForm}>
                      <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                        <FormField
                          control={profileForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>새 이메일</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="새 이메일을 입력하세요" {...field} />
                              </FormControl>
                              <FormDescription>
                                이메일을 변경하면 새 이메일 주소로 확인 링크가 전송됩니다.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" disabled={isUpdatingEmail}>
                          {isUpdatingEmail ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              변경 중...
                            </>
                          ) : (
                            "이메일 변경"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </div>

                  {/* 비밀번호 변경 */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-semibold">비밀번호 변경</h3>
                    <Form {...passwordForm}>
                      <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                        <FormField
                          control={passwordForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>새 비밀번호</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="새 비밀번호를 입력하세요" {...field} />
                              </FormControl>
                              <FormDescription>비밀번호는 최소 6자 이상이어야 합니다.</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={passwordForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>비밀번호 확인</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="새 비밀번호를 다시 입력하세요"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" disabled={isUpdatingPassword}>
                          {isUpdatingPassword ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              변경 중...
                            </>
                          ) : (
                            "비밀번호 변경"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </div>
                </div>
              </TabsContent>

              {/* 결제 내역 탭 */}
              <TabsContent value="orders">
                <div className="rounded-lg border bg-card p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-6">
                    <Receipt className="w-5 h-5" />
                    <h3 className="text-lg font-semibold">결제 내역</h3>
                  </div>

                  {isLoadingOrders ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>결제 내역이 없습니다.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div
                          key={order.id}
                          className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(order.created_at).toLocaleDateString("ko-KR", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                              <div className="font-semibold">주문번호: {order.id.slice(0, 8)}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-lg">
                                ₩{order.total_amount?.toLocaleString() || 0}
                              </div>
                              <div className="text-sm text-muted-foreground">{order.status || "완료"}</div>
                            </div>
                          </div>
                          {order.items && Array.isArray(order.items) && order.items.length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <div className="text-sm font-medium text-muted-foreground mb-2">
                                주문 상품 ({order.items.length}개)
                              </div>
                              <div className="space-y-2">
                                {order.items.map((item: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded"
                                  >
                                    <div className="flex items-center gap-2 flex-1">
                                      {item.image && (
                                        <img
                                          src={item.image}
                                          alt={item.name}
                                          className="w-10 h-10 object-cover rounded"
                                        />
                                      )}
                                      <span className="font-medium">{item.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-muted-foreground">
                                        수량: {item.quantity}
                                      </span>
                                      <span className="font-semibold">
                                        ₩{(item.price * item.quantity)?.toLocaleString() || 0}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default MyPage;
