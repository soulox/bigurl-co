declare module 'authorizenet' {
  namespace APIContracts {
    class MerchantAuthenticationType {
      setName(name: string): void;
      setTransactionKey(key: string): void;
    }

    class CreditCardType {
      setCardNumber(cardNumber: string): void;
      setExpirationDate(expirationDate: string): void;
      setCardCode(cardCode: string): void;
    }

    class PaymentType {
      setCreditCard(creditCard: CreditCardType): void;
    }

    class CustomerAddressType {
      setFirstName(firstName: string): void;
      setLastName(lastName: string): void;
      setEmail(email: string): void;
      setAddress(address: string): void;
      setCity(city: string): void;
      setState(state: string): void;
      setZip(zip: string): void;
      setCountry(country: string): void;
    }

    enum TransactionTypeEnum {
      AUTHCAPTURETRANSACTION = 'authCaptureTransaction',
    }

    class TransactionRequestType {
      setTransactionType(type: string): void;
      setPayment(payment: PaymentType): void;
      setAmount(amount: number): void;
      setBillTo(billTo: CustomerAddressType): void;
    }

    class CreateTransactionRequest {
      setMerchantAuthentication(auth: MerchantAuthenticationType): void;
      setTransactionRequest(request: TransactionRequestType): void;
      getJSON(): any;
    }

    enum MessageTypeEnum {
      OK = 'Ok',
      ERROR = 'Error',
    }

    class CreateTransactionResponse {
      constructor(response: any);
      getMessages(): {
        getResultCode(): MessageTypeEnum;
        getMessage(): Array<{ getCode(): string; getText(): string }>;
      };
      getTransactionResponse(): {
        getTransId(): string;
        getAuthCode(): string;
        getMessages(): {
          getMessage(): Array<{ getDescription(): string }>;
        };
        getErrors(): {
          getError(): Array<{ getErrorCode(): string; getErrorText(): string }>;
        } | null;
      } | null;
    }

    enum ARBSubscriptionUnitEnum {
      MONTHS = 'months',
      YEARS = 'years',
    }

    class PaymentScheduleTypeInterval {
      setLength(length: number): void;
      setUnit(unit: ARBSubscriptionUnitEnum): void;
    }

    class PaymentScheduleType {
      setInterval(interval: PaymentScheduleTypeInterval): void;
      setStartDate(date: string): void;
      setTotalOccurrences(occurrences: number): void;
    }

    class ARBSubscriptionType {
      setName(name: string): void;
      setPaymentSchedule(schedule: PaymentScheduleType): void;
      setAmount(amount: number): void;
      setPayment(payment: PaymentType): void;
      setBillTo(billTo: CustomerAddressType): void;
    }

    class ARBCreateSubscriptionRequest {
      setMerchantAuthentication(auth: MerchantAuthenticationType): void;
      setSubscription(subscription: ARBSubscriptionType): void;
      getJSON(): any;
    }

    class ARBCreateSubscriptionResponse {
      constructor(response: any);
      getMessages(): {
        getResultCode(): MessageTypeEnum;
        getMessage(): Array<{ getCode(): string; getText(): string }>;
      };
      getSubscriptionId(): string;
    }
  }

  namespace APIControllers {
    namespace SDKConstants {
      namespace endpoint {
        const production: string;
        const sandbox: string;
      }
    }

    class CreateTransactionController {
      constructor(json: any);
      setEnvironment(endpoint: string): void;
      execute(callback: () => void): void;
      getResponse(): any;
    }

    class ARBCreateSubscriptionController {
      constructor(json: any);
      setEnvironment(endpoint: string): void;
      execute(callback: () => void): void;
      getResponse(): any;
    }
  }

  const AuthorizeNet: {
    APIContracts: typeof APIContracts;
    APIControllers: typeof APIControllers;
  };

  export default AuthorizeNet;
}

