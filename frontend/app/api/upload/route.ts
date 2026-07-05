import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const pinataJwt = process.env.PINATA_JWT;

    if (!pinataJwt) {
      // Mock upload for testing/development if no credentials are set
      console.warn("PINATA_JWT is not set. Using mock upload.");
      const mockCid = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      return NextResponse.json({
        storage_cid: mockCid,
        is_mock: true,
        message: "Successfully uploaded to mock IPFS storage (PINATA_JWT missing)."
      });
    }

    // Forward the file to Pinata IPFS
    const pinataForm = new FormData();
    pinataForm.append("file", file);
    
    const pinataMetadata = JSON.stringify({
      name: file.name,
    });
    pinataForm.append("pinataMetadata", pinataMetadata);

    const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${pinataJwt}`,
      },
      body: pinataForm,
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { error: `Pinata API error: ${errText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      storage_cid: data.IpfsHash,
      is_mock: false,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
