package com.company.carsharing.ui;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;

import com.company.carsharing.data.SessionHolder;
import com.company.carsharing.data.repository.AuthRepository;
import com.company.carsharing.databinding.FragmentDrivingLicenceBinding;
import com.company.carsharing.network.RetrofitClient;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;

import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.RequestBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class DrivingLicenceFragment extends Fragment {
    private FragmentDrivingLicenceBinding binding;
    private Uri cameraImageUri;

    private final ActivityResultLauncher<Uri> takePictureLauncher =
            registerForActivityResult(new ActivityResultContracts.TakePicture(), success -> {
                if (success && cameraImageUri != null) uploadFromUri(cameraImageUri);
            });

    private final ActivityResultLauncher<String> getContentLauncher =
            registerForActivityResult(new ActivityResultContracts.GetContent(), uri -> {
                if (uri != null) uploadFromUri(uri);
            });

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        binding = FragmentDrivingLicenceBinding.inflate(inflater, container, false);
        if (getActivity() instanceof MainActivity) ((MainActivity) getActivity()).setToolbarTitle("Driving licence");
        String status = SessionHolder.getUser() != null ? SessionHolder.getUser().getDrivingLicenceStatus() : null;
        binding.dlStatus.setText(status != null ? status : "Not set");
        binding.dlUploadGallery.setOnClickListener(v -> getContentLauncher.launch("image/*"));
        binding.dlTakePhoto.setOnClickListener(v -> {
            try {
                File photo = new File(requireContext().getCacheDir(), "dl_photo_" + System.currentTimeMillis() + ".jpg");
                cameraImageUri = androidx.core.content.FileProvider.getUriForFile(requireContext(),
                        requireContext().getPackageName() + ".fileprovider", photo);
                takePictureLauncher.launch(cameraImageUri);
            } catch (Exception e) {
                Toast.makeText(requireContext(), "Camera not available", Toast.LENGTH_SHORT).show();
            }
        });
        return binding.getRoot();
    }

    private void uploadFromUri(Uri uri) {
        try {
            File cache = new File(requireContext().getCacheDir(), "dl_upload_" + System.currentTimeMillis() + ".jpg");
            try (InputStream in = requireContext().getContentResolver().openInputStream(uri);
                 FileOutputStream out = new FileOutputStream(cache)) {
                if (in == null) { Toast.makeText(requireContext(), "Could not read image", Toast.LENGTH_SHORT).show(); return; }
                byte[] buf = new byte[8192];
                int n;
                while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
            }
            uploadFile(cache);
        } catch (Exception e) {
            Toast.makeText(requireContext(), e.getMessage() != null ? e.getMessage() : "Error", Toast.LENGTH_SHORT).show();
        }
    }

    private void uploadFile(File file) {
        if (file == null || !file.exists()) {
            Toast.makeText(requireContext(), "No image", Toast.LENGTH_SHORT).show();
            return;
        }
        binding.dlMessage.setVisibility(View.VISIBLE);
        binding.dlMessage.setText("Uploading…");
        RequestBody body = RequestBody.create(MediaType.parse("image/jpeg"), file);
        MultipartBody.Part part = MultipartBody.Part.createFormData("file", file.getName(), body);
        RetrofitClient.getApiService(new AuthRepository(requireContext()).getSessionPreferences())
                .uploadDrivingLicence(part).enqueue(new Callback<java.util.Map<String, Object>>() {
            @Override
            public void onResponse(Call<java.util.Map<String, Object>> call, Response<java.util.Map<String, Object>> response) {
                if (getActivity() == null) return;
                binding.dlMessage.setVisibility(View.VISIBLE);
                if (response.isSuccessful()) {
                    binding.dlMessage.setText("Uploaded. Status will update after admin review.");
                    String status = SessionHolder.getUser() != null ? SessionHolder.getUser().getDrivingLicenceStatus() : null;
                    binding.dlStatus.setText(status != null ? status : "Pending");
                } else {
                    binding.dlMessage.setText("Upload failed");
                }
            }
            @Override
            public void onFailure(Call<java.util.Map<String, Object>> call, Throwable t) {
                if (getActivity() != null) {
                    binding.dlMessage.setVisibility(View.VISIBLE);
                    binding.dlMessage.setText(t.getMessage() != null ? t.getMessage() : "Error");
                }
            }
        });
    }
}
