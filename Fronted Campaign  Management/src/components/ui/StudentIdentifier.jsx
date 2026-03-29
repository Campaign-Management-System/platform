import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CreditCard, User } from "lucide-react";
import CardScanner from "@/components/ui/CardScanner";
import StudentIdentifierInput from "@/components/ui/StudentIdentifierInput";

export default function StudentIdentifier({ onIdentify }) {
  const [activeTab, setActiveTab] = useState("card");

  return (
    <Card className="rounded-2xl shadow-xl border">
      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="card" className="gap-2">
              <CreditCard className="w-4 h-4" />
              סריקת כרטיס
            </TabsTrigger>

            <TabsTrigger value="id" className="gap-2">
              <User className="w-4 h-4" />
              הקלדת ת"ז
            </TabsTrigger>
          </TabsList>

          <TabsContent value="card">
            <CardScanner onCardScanned={onIdentify} />
          </TabsContent>

          <TabsContent value="id">
            <StudentIdentifierInput onSubmit={onIdentify} />
          </TabsContent>

        </Tabs>
      </CardContent>
    </Card>
  );
}
