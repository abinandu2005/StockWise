

async function test() {
  try {
    // 1. Get auth token
    const loginRes = await fetch("http://localhost:9090/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "abinandu2005@gmail.com", password: "Abinandu@2005" })
    });
    const loginData = await loginRes.json();
    const token = loginData.data.accessToken;

    // 2. Fetch sales orders
    const soRes = await fetch("http://localhost:9090/api/sales-orders", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const soData = await soRes.json();
    console.log("Sales Orders:", JSON.stringify(soData, null, 2));

    const content = soData.content || [];
    if (content.length > 0) {
      const order = content[0];
      console.log("Attempting to dispatch order:", order.id);

      const dispatchPayload = {
        salesOrderId: order.id,
        orderNumber: order.orderNumber,
        dispatchDate: new Date().toISOString().substring(0, 19),
        trackingNumber: "TRK-TEST",
        carrier: "FedEx",
        status: "DISPATCHED",
        dispatchedBy: "Admin"
      };

      const dispatchRes = await fetch("http://localhost:9090/api/dispatch", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(dispatchPayload)
      });
      
      const dispatchText = await dispatchRes.text();
      console.log("Dispatch status:", dispatchRes.status);
      console.log("Dispatch response:", dispatchText);
      
      // 3. Mark delivered
      const updatePayload = {
        status: "DELIVERED",
        deliveredDate: new Date().toISOString().substring(0, 19)
      };
      
      const updateRes = await fetch(`http://localhost:9090/api/sales-orders/${order.id}`, {
        method: "PUT",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updatePayload)
      });
      const updateText = await updateRes.text();
      console.log("Update status:", updateRes.status);
      console.log("Update response:", updateText);
    } else {
      console.log("No sales orders found to test.");
    }
  } catch (e) {
    console.error(e);
  }
}

test();
