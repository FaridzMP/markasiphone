import { db } from '../../../../lib/db';

export async function GET() {
  try {
    const [rows]: any = await db.query(
      'SELECT total_modal FROM finance_settings WHERE id = 1 LIMIT 1'
    );
    const totalModal = rows.length > 0 ? Number(rows[0].total_modal) : 0;
    return Response.json({ total_modal: totalModal });
  } catch (error) {
    console.error('[GET /api/keuangan/modal]', error);
    return Response.json({ total_modal: 0 });
  }
}

export async function POST(request: Request) {
  try {
    const { total_modal } = await request.json();

    await db.query(
      `UPDATE finance_settings SET total_modal = ? WHERE id = 1`,
      [total_modal]
    );

    return Response.json({ success: true });
  } catch (error) {
    console.error('[POST /api/keuangan/modal]', error);
    return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}