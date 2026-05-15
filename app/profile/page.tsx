"use client";

import { ProfileSidebar }    from "@/components/profile/components/ProfileSidebar";
import { PersonalInfo }      from "@/components/profile/components/PersonalInfo";
import { OrderHistory }      from "@/components/profile/components/OrderHistory";
import { OrderDetailDialog } from "@/components/profile/components/OrderDetailDialog";
import { OverviewWidgets }   from "@/components/profile/components/OverviewWidgets";
import { useProfile }        from "@/components/profile/hooks/use-profile";

export default function ProfilePage() {
  const {
    activeTab,     setActiveTab,
    loadingInfo,   loadingOrders, saving,
    userInfo,      allTiers,      orders,
    form,
    selectedOrder, dialogOpen,    setDialogOpen,
    handleLogout,  handleFormChange, handleSave, handleSelectOrder,
  } = useProfile();

  return (
    <div className="min-h-screen bg-muted/40 pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8 items-start">

          <ProfileSidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            userInfo={userInfo}
            onLogout={handleLogout}
            loading={loadingInfo}
          />

          <main className="min-w-0">
            <OverviewWidgets
              userInfo={userInfo}
              allTiers={allTiers}
              orders={orders}
              loadingInfo={loadingInfo}
              loadingOrders={loadingOrders}
            />

            {activeTab === "info" ? (
              <PersonalInfo
                userInfo={userInfo}
                allTiers={allTiers}
                form={form}
                saving={saving}
                loading={loadingInfo}
                onFormChange={handleFormChange}
                onSave={handleSave}
              />
            ) : (
              <OrderHistory
                orders={orders}
                loading={loadingOrders}
                onSelectOrder={handleSelectOrder}
              />
            )}
          </main>

        </div>
      </div>

      <OrderDetailDialog
        order={selectedOrder}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
}
