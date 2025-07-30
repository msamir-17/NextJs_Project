"use server";
import { z } from "zod";
import postgres from "postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(["pending", "paid"]),
  date: z.string(),
});

export async function deleteInvoice(id: string) {
  throw new Error("Failed to delete invoice");
  
  await sql`DELETE FROM invoices WHERE id = ${id}`;
  revalidatePath("/dashboard/invoices");
}

// Use Zod to update the expected types
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

// ...

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  const amountInCents = amount * 100;
  try {
    await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `;
  } catch (error) {
    console.error("Error updating invoice:", error);
  }
  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

const CreateInvoice = FormSchema.omit({ id: true, date: true });
export async function createInvoice(formdata: FormData) {
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formdata.get("customerId"),
    amount: formdata.get("amount"),
    status: formdata.get("status"),
  });
  // console.log(rawFormData);
  // console.log(typeof rawFormData.amount);
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T")[0];
  try {
    await sql`
       
       insert into invoices (customer_id, amount, status, date)
       values (${customerId}, ${amountInCents}, ${status}, ${date})
       `;
  } catch (err) {
    console.error("Error creating invoice:", err);
  }

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}
