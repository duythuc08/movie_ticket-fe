"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  updateMyInfo,
  fetchAllMembershipTiers,
  fetchOrdersByUser,
} from "@/components/profile/service/user.service";
import { useAuth } from "@/context/AuthContext";
import type { UserInfo, MembershipTier, Order } from "@/types";
import type { ProfileFormState } from "@/components/profile/user.types";

export function useProfile() {
  const router = useRouter();
  const { user: authUser, token, isAuthenticated } = useAuth();

  const [activeTab,     setActiveTab]     = useState<"info" | "orders" | "voucher">("info");
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
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Sync userInfo and form from AuthContext — no extra API call
  useEffect(() => {
    if (!authUser) return;
    setUserInfo(authUser);
    setForm({
      firstname:   authUser.firstname   || "",
      lastname:    authUser.lastname    || "",
      phoneNumber: authUser.phoneNumber || "",
      birthday:    authUser.birthday    || "",
    });
    localStorage.setItem("user", JSON.stringify({
      userId:             authUser.userId,
      username:           authUser.username,
      firstname:          authUser.firstname,
      lastname:           authUser.lastname,
      birthday:           authUser.birthday,
      memberShipTierName: authUser.memberShipTierName,
    }));
    setLoadingInfo(false);
  }, [authUser]);

  useEffect(() => {
    if (!token) return;
    fetchAllMembershipTiers(token)
      .then(setAllTiers)
      .catch((e) => console.error("Lỗi lấy hạng thành viên:", e));
  }, [token]);

  useEffect(() => {
    if (!userInfo?.userId || !token) return;

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
  }, [userInfo?.userId, token]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
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
