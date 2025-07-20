import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Edit, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { CreditCardService } from "@/services/CreditCardService";
import { useAuth } from "@/services/auth-service";

interface CreditCardData {
  id?: string;
  name: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  limit: number;
  interestRate: number;
  userId?: string;
}

export function CreditCardManager() {
  const [creditCards, setCreditCards] = useState<CreditCardData[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CreditCardData | null>(null);
  const [name, setName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [limit, setLimit] = useState<number>(0);
  const [interestRate, setInterestRate] = useState<number>(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchCreditCards = async () => {
      try {
        const cards = await CreditCardService.getCreditCards(user.uid);
        setCreditCards(cards);
      } catch (error: any) {
        toast.error(`Failed to fetch credit cards: ${error.message}`);
      }
    };

    fetchCreditCards();
  }, [user]);

  const handleAddClick = () => {
    setIsAdding(true);
    setName("");
    setCardNumber("");
    setExpiryDate("");
    setCvv("");
    setLimit(0);
    setInterestRate(0);
  };

  const handleEditClick = (card: CreditCardData) => {
    setIsEditing(true);
    setSelectedCard(card);
    setName(card.name);
    setCardNumber(card.cardNumber);
    setExpiryDate(card.expiryDate);
    setCvv(card.cvv);
    setLimit(card.limit);
    setInterestRate(card.interestRate);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setIsEditing(false);
    setSelectedCard(null);
    setName("");
    setCardNumber("");
    setExpiryDate("");
    setCvv("");
    setLimit(0);
    setInterestRate(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in to add a credit card.");
      return;
    }

    const cardData: CreditCardData = {
      name,
      cardNumber,
      expiryDate,
      cvv,
      limit,
      interestRate,
      userId: user.uid,
    };

    try {
      if (isAdding) {
        await CreditCardService.addCreditCard(cardData);
        toast.success("Credit card added successfully!");
      } else if (isEditing && selectedCard) {
        await CreditCardService.updateCreditCard(selectedCard.id!, { ...cardData, id: selectedCard.id! });
        toast.success("Credit card updated successfully!");
      }

      const updatedCards = await CreditCardService.getCreditCards(user.uid);
      setCreditCards(updatedCards);
      handleCancel();
    } catch (error: any) {
      toast.error(`Failed to save credit card: ${error.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this credit card?")) {
      return;
    }

    try {
      await CreditCardService.deleteCreditCard(id);
      const updatedCards = await CreditCardService.getCreditCards(user.uid);
      setCreditCards(updatedCards);
      toast.success("Credit card deleted successfully!");
    } catch (error: any) {
      toast.error(`Failed to delete credit card: ${error.message}`);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Credit Cards</CardTitle>
        <Button onClick={handleAddClick}>
          <Plus className="mr-2 h-4 w-4" /> Add Credit Card
        </Button>
      </CardHeader>
      <CardContent>
        {creditCards.length === 0 ? (
          <p>No credit cards added yet.</p>
        ) : (
          <div className="grid gap-4">
            {creditCards.map((card) => (
              <Card key={card.id} className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xl font-bold flex items-center">
                    <CreditCard className="mr-2 h-5 w-5 text-gray-500" />
                    {card.name}
                  </CardTitle>
                  <div>
                    <Button variant="ghost" size="sm" onClick={() => handleEditClick(card)}>
                      <Edit className="mr-2 h-4 w-4" /> Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(card.id!)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    <div>
                      <Label>Card Number</Label>
                      <Input type="text" value={card.cardNumber} readOnly />
                    </div>
                    <div>
                      <Label>Expiry Date</Label>
                      <Input type="text" value={card.expiryDate} readOnly />
                    </div>
                    <div>
                      <Label>Limit</Label>
                      <Input type="number" value={card.limit} readOnly />
                    </div>
                    <div>
                      <Label>Interest Rate</Label>
                      <Input type="number" value={card.interestRate} readOnly />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {(isAdding || isEditing) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-75">
            <Card className="max-w-md w-full p-4">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-2xl font-bold">{isAdding ? "Add Credit Card" : "Edit Credit Card"}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="grid gap-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      type="text"
                      id="cardNumber"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Input
                      type="text"
                      id="expiryDate"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      type="text"
                      id="cvv"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="limit">Limit</Label>
                    <Input
                      type="number"
                      id="limit"
                      value={limit}
                      onChange={(e) => setLimit(Number(e.target.value))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="interestRate">Interest Rate</Label>
                    <Input
                      type="number"
                      id="interestRate"
                      value={interestRate}
                      onChange={(e) => setInterestRate(Number(e.target.value))}
                      required
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button type="button" variant="ghost" onClick={handleCancel}>
                      Cancel
                    </Button>
                    <Button type="submit">{isAdding ? "Add" : "Update"}</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
