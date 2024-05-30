import { create as createIpsf, IPFSHTTPClient } from "ipfs-http-client";
import { ipfsPath } from "../../utils/util";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { image, tokenName } = req.body;

    // Decode the Base64 image
    const base64Image = image.split(";base64,").pop();
    const imageBuffer = Buffer.from(base64Image, "base64");

    const projectId = process.env.INFURA_IPFS_ID;
    const projectSecret = process.env.INFURA_IPFS_SECRET;
    const auth = "Basic " + Buffer.from(projectId + ":" + projectSecret).toString("base64");
    const ipfs: IPFSHTTPClient = createIpsf({
      host: "ipfs.infura.io",
      port: 5001,
      protocol: "https",
      headers: {
        authorization: auth,
      },
    });

    // Upload the image
    const uploadedImage = await ipfs.add(imageBuffer);
    const imagePath = `${ipfsPath}/${uploadedImage.path}`;

    // Upload JSON Metadata
    const metadata = { tokenName, tokenImage: imagePath };
    const uploadedMetadata = await ipfs.add(Buffer.from(JSON.stringify(metadata)));
    const metadataPath = `${ipfsPath}/${uploadedMetadata.path}`;

    res.status(200).json({ imagePath, metadataPath });
  } else {
    res.status(405).send("Method Not Allowed");
  }
}
