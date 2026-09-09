package com.fintrack.app.models;

import com.google.gson.annotations.SerializedName;

public class AIScanReceiptRequest {
    @SerializedName("image_base64")
    private String imageBase64;

    @SerializedName("mime_type")
    private String mimeType;

    public AIScanReceiptRequest(String imageBase64, String mimeType) {
        this.imageBase64 = imageBase64;
        this.mimeType = mimeType;
    }

    public String getImageBase64() { return imageBase64; }
    public String getMimeType() { return mimeType; }
}
