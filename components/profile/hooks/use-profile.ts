"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  fetchMyInfo,
  updateMyInfo,
  fetchAllMembershipTiers,
  fetchOrdersByUser,
} from "@/components/profile/service/user.service";
import type { UserInfo, MembershipTier, Order } from "@/types";
import type { ProfileFormState } from "@/components/profile/user.types";

export function useProfile() {
  const router = useRouter();

  const [activeTab,     setActiveTab]     = useState<"info" | "orders">("info");
  const [loadingInfo,   setLoadingInfo]   = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [userInfo,      setUserInfo]      = useState<UserInfo | null>(null);
  const [allTiers,      setAllTiers]      = useState<MembershipTier[]>([]);
  const [orders,        setOrders]        = useState<Order[]>([]);
  const [form,          setForm]          = useState<ProfileFormState>({
    firstname: "", lastname: "", phoneNumber: "", birthday: "",
  });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dialogOpen,    setDialogOpen]    = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("pendingOrder");
    router.push("/login");
  };

  useEffect(() => {
    const token = localStorage.getItem("token") ?? "";
    fetchAllMembershipTiers(token)
      .then(setAllTiers)
      .catch((e) => console.error("Lỗi lấy hạng thành viên:", e));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    (async () => {
      try {
        const info = await fetchMyInfo(token);
        setUserInfo(info);
        setForm({
          firstname:   info.firstname   || "",
          lastname:    info.lastname    || "",
          phoneNumber: info.phoneNumber || "",
          birthday:    info.birthday    || "",
        });
        localStorage.setItem("user", JSON.stringify({
          userId:             info.userId,
          username:           info.username,
          firstname:          info.firstname,
          lastname:           info.lastname,
          birthday:           info.birthday,
          memberShipTierName: info.memberShipTierName,
        }));
      } catch (e) {
        const err = e as Error;
        if (err.message?.includes("401") || err.message?.includes("403")) {
          toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
          router.push("/login");
        } else {
          toast.error("Không thể tải thông tin tài khoản.");
        }
      } finally {
        setLoadingInfo(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!userInfo?.userId) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoadingOrders(true);
    (async () => {
      try {
        const result = await fetchOrdersByUser(token, userInfo.userId);
        setOrders(Array.isArray(result) ? result : []);
      } catch (e) {
        console.error(e);
        toast.error("Không thể tải danh sách đơn hàng.");
        setOrders([]);
      } finally {
        setLoadingOrders(false);
      }
    })();
  }, [userInfo?.userId]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) { router.push("/login"); return; }
      await updateMyInfo(token, form);
      setUserInfo((p) => (p ? { ...p, ...form } : p));
      toast.success("Cập nhật thông tin thành công!");
    } catch {
      toast.error("Cập nhật thất bại. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    setDialogOpen(true);
  };

  return {
    activeTab,     setActiveTab,
    loadingInfo,   loadingOrders, saving,
    userInfo,      allTiers,      orders,
    form,
    selectedOrder, dialogOpen,    setDialogOpen,
    handleLogout,  handleFormChange, handleSave, handleSelectOrder,
  };
}
