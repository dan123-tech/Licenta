package com.company.carsharing.ui.login;

import android.app.Application;

import androidx.annotation.NonNull;
import androidx.lifecycle.AndroidViewModel;
import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;

import com.company.carsharing.data.repository.AuthRepository;
import com.company.carsharing.models.User;

/**
 * ViewModel for the Login screen (MVVM).
 */
public class LoginViewModel extends AndroidViewModel {

    private final AuthRepository authRepository;
    private final MutableLiveData<Boolean> loading = new MutableLiveData<>(false);
    private final MutableLiveData<User> loginSuccess = new MutableLiveData<>();
    private final MutableLiveData<String> error = new MutableLiveData<>();

    public LoginViewModel(@NonNull Application application) {
        super(application);
        this.authRepository = new AuthRepository(application);
    }

    public LiveData<Boolean> getLoading() {
        return loading;
    }

    public LiveData<User> getLoginSuccess() {
        return loginSuccess;
    }

    public LiveData<String> getError() {
        return error;
    }

    public void login(String email, String password, boolean rememberMe) {
        if (email == null || email.trim().isEmpty()) {
            error.setValue("Please enter your email");
            return;
        }
        if (password == null || password.isEmpty()) {
            error.setValue("Please enter your password");
            return;
        }
        loading.setValue(true);
        error.setValue(null);
        loginSuccess.setValue(null);

        authRepository.login(email.trim(), password, rememberMe, new AuthRepository.AuthCallback() {
            @Override
            public void onSuccess(User user) {
                loading.postValue(false);
                loginSuccess.postValue(user);
            }

            @Override
            public void onError(String message) {
                loading.postValue(false);
                error.postValue(message);
            }
        });
    }
}
