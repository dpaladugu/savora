
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, CreditCard as CreditCardIcon, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { CreditCard } from '@/db';
import { db } from '@/db';
import { format } from 'date-fns';

export function CreditCardFlowTracker() {
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const cards = await db.creditCards.toArray();
      // Map cards from lib/db to db schema, adding missing properties
      const mappedCards: CreditCard[] = cards.map(card => ({
        ...card,
        fxTxnFee: card.fxTxnFee || 0,
        emiConversion: card.emiConversion || false
      }));
      setCreditCards(mappedCards);
    } catch (error) {
      console.error('Error loading credit card data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit Card Flow Tracker</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <>
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Credit Cards</h3>
              {creditCards.map((card) => (
                <div key={card.id} className="mb-2 p-2 border rounded-md">
                  <CreditCardIcon className="inline-block mr-2" />
                  {card.issuer} {card.bankName} - *{card.last4}
                  <Badge variant="secondary" className="ml-2">{card.network}</Badge>
                  <div className="text-sm text-muted-foreground">
                    Credit Limit: ₹{card.creditLimit.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
            {creditCards.length === 0 && (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No credit cards found</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
