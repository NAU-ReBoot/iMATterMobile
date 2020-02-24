import { Component, OnInit } from '@angular/core';

import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { LoadingController, AlertController } from '@ionic/angular';
import { AuthServiceProvider, User} from '../../../services/user/auth.service';
import { FcmService } from '../../../services/pushNotifications/fcm.service';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/firestore';
import { ToastController } from '@ionic/angular';
import { Storage } from '@ionic/storage';

@Component({
    selector: 'app-login',
    templateUrl: './login.page.html',
    styleUrls: ['./login.page.scss'],
})


export class LoginPage implements OnInit {

    public loginForm: FormGroup;
    public loading: HTMLIonLoadingElement;
    private email: string;
    private password: string;
    private userID: string;
    private userEmail: boolean;
    private userPassword: string;


    constructor(
        public loadingCtrl: LoadingController,
        public alertCtrl: AlertController,
        private authService: AuthServiceProvider,
        private router: Router,
        private formBuilder: FormBuilder,
        public afs: AngularFirestore,
        private toastCtrl: ToastController,
        private storage: Storage,
        private fcm: FcmService
    ) {
        this.loginForm = this.formBuilder.group({
            email: ['',
                Validators.compose([Validators.required, Validators.email])],
            password: [
                '',
                Validators.compose([Validators.required, Validators.minLength(6)]),
            ],
        });
    }

    ngOnInit() {
        this.storage.set('authenticated', 'false');
    }

    private notificationSetup(userID) {
        console.log(userID);
        this.fcm.getToken(userID);
        /*
        this.fcm.onNotifications().subscribe(
            (msg) => {
                this.presentToast(msg.body);
            });*/
    }

    validateUser(loginForm: FormGroup) {
        this.email = loginForm.value.email;
        this.password = loginForm.value.password;

        this.afs.firestore.collection('users').where('email', '==', this.email)
            .get().then(snapshot => {
            if (snapshot.docs.length > 0) {
                console.log(('exists'));
                this.userEmail = true;
                const userRef = this.afs.firestore.collection('users').where('email', '==', this.email);
                userRef.get().then((result) => {
                    result.forEach(doc => {
                        this.userID = doc.id;
                        this.userPassword = doc.get('password');

                        if ( this.userPassword === this.password) {
                            this.storage.set('userCode', this.userID);
                            this.storage.set('authenticated', 'true');
                            this.storage.set('username', doc.get('username'));
                            this.storage.set('dueDate', doc.get('dueDate'));
                            this.storage.set('cohort', doc.get('cohort'));

                            this.getCurrentPregnancyStatus(doc.get('dueDate'));

                            if (doc.get('chatNotif') === true) {
                                this.notificationSetup(this.userID);
                            }



                            this.router.navigate(['/tabs/home/']);
                        } else {
                            this.showToast('Password is incorrect');
                        }

                    });
                });

            } else {
                console.log('Email does not exist');
                this.userEmail = false;
            }
        });
    }

    showToast(msg) {
        this.toastCtrl.create({
            message: msg,
            duration: 2000
        }).then(toast => toast.present());
    }

    getCurrentPregnancyStatus(dueDate) {
        const currentDateString = new Date().toJSON().split('T')[0];
        const currentDate = new Date(currentDateString);
        const userDueDate = new Date(dueDate);
        const dateDiff = Math.abs(currentDate.getTime() - userDueDate.getTime());
        const diffInDays = Math.ceil(dateDiff / (24 * 3600 * 1000));
        const totalDays = 280 - diffInDays;
        this.storage.set('totalDaysPregnant', totalDays);
        const weeksPregnant = Math.floor(totalDays / 7);
        this.storage.set('weeksPregnant', weeksPregnant);
        const daysPregnant = totalDays % 7;
        this.storage.set('daysPregnant', daysPregnant);

        this.storage.get('userCode').then((val) => {
            if (val) {
                this.afs.firestore.collection('users').where('code', '==', val)
                    .get().then(snapshot => {
                    snapshot.forEach(doc => {
                        this.afs.firestore.collection('users')
                            .doc(val).update({weeksPregnant: weeksPregnant, daysPregnant: daysPregnant, totalDaysPregnant: totalDays});
                    });
                });
            }
        });
    }


    private async presentToast(message) {
        const toast = await this.toastCtrl.create({
            message,
            duration: 3000
        });
        toast.present();
    }

}
