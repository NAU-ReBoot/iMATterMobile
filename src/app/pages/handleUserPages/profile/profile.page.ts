import {Component, OnInit} from '@angular/core';
import {AlertController, ToastController} from '@ionic/angular';
import {AuthServiceProvider, User} from '../../../services/user/auth.service';
import {ProfileService} from '../../../services/user/profile.service';
import {ActivatedRoute, Router} from '@angular/router';
import {Storage} from '@ionic/storage';
import {AngularFirestore} from '@angular/fire/firestore';
import {Observable} from 'rxjs';
import * as firebase from 'firebase/app';
import {AnalyticsService, Analytics, Sessions} from 'src/app/services/analyticsService.service';
import {HttpClient} from '@angular/common/http';
import {DatePipe} from '@angular/common';
import { MoodProviderNotifService, EmotionNotif } from '../../../services/mood-provider-notif.service';
import { ChatService, Cohort, Chat } from '../../../services/chat/chat-service.service';
import { HomePage } from '../../home/home.page';

@Component({
    selector: 'app-profile',
    templateUrl: './profile.page.html',
    styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
    user: User = {
        code: '',
        username: '',
        email: '',
        password: '',
        dueDate: '',
        endRehabDate: '',
        location: 0,
        cohort: '',
        weeksPregnant: '',
        daysPregnant: '',
        totalDaysPregnant: '',
        bio: '',
        securityQ: '',
        securityA: '',
        currentEmotion: '',
        profilePic: '',
        joined: '',
        daysAUser: 0,
        points: 0,
        chatNotif: true,
        learningModNotif: true,
        surveyNotif: true,
        infoDeskNotif: true,
        token: '',
        recentNotifications: [],
        answeredSurveys: [],
        joinedChallenges: [],
        completedChallenges: [],
        codeEntered: true,
        dailyQuote: ''

    };

    chat: Chat = {
        cohort: '',
        username: '',
        userID: '',
        timestamp: '',
        message: '',
        profilePic: '',
        type: '',
        visibility: true,
        count: 0
    };

    analytic: Analytics =
        {
            page: '',
            userID: '',
            timestamp: '',
            sessionID: ''
        };

    emotionNotif: EmotionNotif = {
        userID: '',
        username: '',
        emotionEntered: '',
        viewed: false,
        timestamp: ''
    };

    session: Sessions =
        {
            userID: '',
            LogOutTime: '',
            LoginTime: '',
            numOfClickChat: 0,
            numOfClickCalendar: 0,
            numOfClickLModule: 0,
            numOfClickInfo: 0,
            numOfClickSurvey: 0,
            numOfClickProfile: 0,
            numOfClickMore: 0,
            numOfClickHome: 0
        };

    private userProfileID: any;
    public pointsForRedemption: any;
    private analytics: string;
    private sessions: Observable<any>;
    public canRedeemPoints: boolean;
    public displayRedeemOptions: boolean;
    public chosenGCType: string;
    public gcTypes: Array<string>;
    public userEmotionIcon: string;
    public recoveryDate: any;
    public editingMode = false;
    public showImages = false;
    public allPicURLs: any;
    public previewPic: any;

    public emotionIcons = {
        excited: '🤗',
        happy: '😃',
        loved: '🥰',
        ok: '😐',
        stressed: '😩',
        sad: '😢',
        angry: '😡',
    };

    static checkUserPoints(userPoints, pointsNeeded): boolean {
        return userPoints >= pointsNeeded;
    }

    constructor(
        private alertCtrl: AlertController,
        private authService: AuthServiceProvider,
        private profileService: ProfileService,
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private afs: AngularFirestore,
        private storage: Storage,
        private analyticsService: AnalyticsService,
        private alertController: AlertController,
        private toastCtrl: ToastController,
        private http: HttpClient,
        private datePipe: DatePipe,
        private chatService: ChatService,
        private mpnService: MoodProviderNotifService,
    ) {
        this.getProfilePictureChoices();
    }

    ngOnInit() {
        this.storage.get('authenticated').then((val) => {
            if (val === 'false') {
                this.router.navigate(['/login/']);
            }
        });

        this.displayRedeemOptions = false;
    }

    // get user info
    ionViewWillEnter() {
        this.addView();
        this.refreshPage();
    }

    updateLogOut() {
        this.analyticsService.updateLogOut(this.session);
        console.log('added LogOutTime');
    }

    addView() {
        // this.analytic.sessionID = this.session.id;
        this.storage.get('userCode').then((val) => {
            if (val) {
                const ref = this.afs.firestore.collection('users').where('code', '==', val);
                ref.get().then((result) => {
                    result.forEach(doc => {
                        this.analytic.page = 'profile';
                        this.analytic.userID = val;
                        this.analytic.timestamp = firebase.firestore.FieldValue.serverTimestamp();
                        // this.analytic.sessionID = this.idReference;
                        this.analyticsService.addView(this.analytic).then(() => {
                            console.log('successful added view: profile');

                        }, err => {
                            console.log('unsuccessful added view: profile');

                        });
                    });
                });
            }
        });
    }

    // log user out, sets authentication to false and removes some unnecessary storage
    logOut(): void {
        this.storage.set('authenticated', 'false');
        this.storage.remove('userCode');
        this.storage.remove('totalDaysPregnant');
        this.storage.remove('weeksPregnant');
        this.storage.remove('daysPregnant');
        this.router.navigateByUrl('login');
    }

    validateEmail(email) {
        return /(.+)@(.+){2,}\.(.+){2,}/.test(email);
    }

    // allows user to update email if the put in their current password
    async updateEmail(): Promise<void> {
        const alert = await this.alertCtrl.create({
            header: 'Update Email',
            inputs: [
                {type: 'text', name: 'newEmail', placeholder: 'Your new email'},
                {name: 'password', placeholder: 'Your password', type: 'password'},
            ],
            buttons: [
                {text: 'Cancel'},
                {
                    text: 'Save',
                    handler: data => {
                        if (this.validateEmail(data.newEmail)) {
                            this.profileService.updateEmail(data.newEmail, data.password, this.userProfileID)
                                .then(() => {
                                        this.showToast('Your email has been updated!');
                                        this.storage.set('email', data.newEmail);
                                        this.refreshPage();
                                    },
                                    err => {
                                        this.showToast('There was a problem updating your email');
                                    });
                        } else {
                            alert.message = 'Invalid Email';
                            return false;
                        }
                    },
                },
            ],
        });
        await alert.present();
    }

    async updatePassword(): Promise<void> {
        const alert = await this.alertCtrl.create({
            header: 'Update Password',
            inputs: [
                {name: 'oldPassword', placeholder: 'Old password', type: 'password'},
                {name: 'newPassword', placeholder: 'New password', type: 'password'},
            ],
            buttons: [
                {text: 'Cancel'},
                {
                    text: 'Save',
                    handler: data => {
                        if (data.newPassword.length >= 8) {
                            this.profileService.updatePassword(data.newPassword, data.oldPassword, this.userProfileID)
                                .then(() => {
                                        this.showToast('Your password has been updated!');
                                        this.refreshPage();
                                    },
                                    err => {
                                        this.showToast('There was a problem updating your password');
                                    });
                        } else {
                            alert.message = 'Password must be 8 characters or longer';
                            return false;
                        }
                    },
                },
            ],
        });
        await alert.present();
    }

    validateLocation(zip) {
        return /^[0-9]{5}(?:-[0-9]{4})?$/.test(zip) || zip === '';
    }

    async updateLocation(): Promise<void> {
        const alert = await this.alertCtrl.create({
            header: 'Update Location (Zip Code)',
            inputs: [
                {type: 'text', name: 'newLocation', placeholder: 'Leave empty to remove'},
            ],
            buttons: [
                {text: 'Cancel'},
                {
                    text: 'Save',
                    handler: data => {

                        if (this.validateLocation(data.newLocation)) {
                            this.profileService.updateLocation(data.newLocation, this.userProfileID)
                                .then(() => {
                                        this.showToast('Your location has been updated!');
                                        this.refreshPage();
                                    },
                                    err => {
                                        this.showToast('There was a problem updating your location');
                                    });
                        } else {
                            alert.message = 'Invalid Zip Code';
                            return false;
                        }
                    },
                },
            ],
        });
        await alert.present();
    }

    // async updateBio(): Promise<void> {
    //     const alert = await this.alertCtrl.create({
    //         header: 'Update Bio',
    //         inputs: [
    //             {type: 'text', name: 'newBio', placeholder: 'Nothing personal!'},
    //         ],
    //         buttons: [
    //             {text: 'Cancel'},
    //             {
    //                 text: 'Save',
    //                 handler: data => {
    //                     this.profileService.updateBio(data.newBio, this.userProfileID)
    //                         .then(() => {
    //                                 this.showToast('Your bio has been updated!');
    //                                 this.refreshPage();
    //                             },
    //                             err => {
    //                                 this.showToast('There was a problem updating your bio');
    //                             });
    //                 },
    //             },
    //         ],
    //     });
    //     await alert.present();
    // }

    /**
     * Grabs the user's necessary info for the profile
     * Can be called to refresh the data on the page
     */
    refreshPage() {
        this.storage.get('userCode').then((val) => {
            if (val) {
                this.userProfileID = val;
                const ref = this.afs.firestore.collection('users').where('code', '==', val);
                ref.get().then((result) => {
                    result.forEach(doc => {
                        this.user.username = doc.get('username');
                        this.user.email = doc.get('email');
                        this.user.password = doc.get('password');
                        this.user.bio = doc.get('bio');
                        this.user.location = doc.get('location');
                        // this.user.cohort = doc.get('cohort');
                        // const rehabDate = new Date(doc.get('endRehabDate'));
                        // this.user.endRehabDate = this.datepipe.transform(rehabDate, 'D MM YYYY');
                        // this.user.endRehabDate = doc.get('endRehabDate');
                        const date = new Date(doc.get('endRehabDate') + 'T12:00:00');
                        this.recoveryDate = date;
                        // console.log(date);
                        this.user.endRehabDate = doc.get('endRehabDate');
                        // console.log(dateString);
                        this.user.currentEmotion = doc.get('mood');
                        this.user.profilePic = doc.get('profilePic');
                        this.previewPic = this.user.profilePic;
                        this.user.points = doc.get('points');
                        this.userEmotionIcon = this.getUserEmotionIcon(this.user.currentEmotion);

                        const pointRef = firebase.firestore().collection('settings').doc('giftCardSettings').get();
                        pointRef.then((res) => {
                            this.pointsForRedemption = res.get('points');
                            this.gcTypes = res.get('types');
                            this.canRedeemPoints = ProfilePage.checkUserPoints(this.user.points, this.pointsForRedemption);
                        });
                    });
                });
            }
        });
    }

    // gets admin set point amount and uses that to
    displayPointInfo() {
        const pointRef = firebase.firestore().collection('settings').doc('giftCardSettings').get();
        pointRef.then((res) => {
            const points = res.get('points');
            this.presentAlert('Earning Points',
                'You can earn points by completing surveys and answering learning module questions. Once you have earned ' +
                +points + ' points, you will see a redeem button, which you may press to use your points to get a gift card for $5');
        });
    }

    // this function deducts the admin set point amount from the user
    // and sends an email to the admin set email
    redeemGiftCard(currentPoints, pointsUsed, gcType, email, username) {

        this.profileService.updatePoints(currentPoints, pointsUsed, this.userProfileID);
        this.displayRedeemOptions = false;

        this.refreshPage();

        // send an email
        firebase.firestore().collection('settings').doc('giftCardSettings').get().then((result) => {
            const adminEmail = result.get('email');
            this.profileService.addToRedeemTable(adminEmail, email, username, gcType);
        });
        this.showToast('An email was sent for your gift card request!');
    }

    saveEmotion(emotion: string) {
        this.afs.firestore.collection('users').doc(this.userProfileID)
            .update({mood: emotion});

        this.user.currentEmotion = emotion;

        this.chat.cohort = this.user.cohort;
        this.chat.userID = this.userProfileID;
        this.chat.username = this.user.username;
        this.chat.profilePic = this.user.profilePic;
        this.chat.timestamp = firebase.firestore.FieldValue.serverTimestamp();
        this.chat.message = this.chat.username + ' is currently feeling ' + emotion;
        this.chat.type = 'emotion';
        this.chat.visibility = true;

        this.chatService.addChat(this.chat).then(() => {
            this.chat.message = '';
        });

        this.updateEmotionBadge(this.user.currentEmotion);

        if (emotion === 'sad' || emotion === 'stressed' || emotion === 'angry') {
            this.presentAlert('Stay Strong!',
                'Remember you have your cohort to support you and health modules available to you! If you need help,' +
                'please go to the Resources page to find help near you.');

            this.emotionNotif.userID = this.userProfileID;
            this.emotionNotif.username = this.user.username;
            this.emotionNotif.emotionEntered = emotion;
            this.emotionNotif.timestamp = firebase.firestore.FieldValue.serverTimestamp();
            this.mpnService.addEmotionNotif(this.emotionNotif);
        }
    }

    updateEmotionBadge(emotion: string) {
        const emotionBadge = this.getUserEmotionIcon(emotion);
        const badge = document.getElementsByTagName('ion-badge');
        badge.item(0).innerHTML = emotionBadge;
    }

    getUserEmotionIcon(emotion: string) {
        if (emotion === 'excited') {
            return this.emotionIcons.excited;
        } else if (emotion === 'happy') {
            return this.emotionIcons.happy;
        } else if (emotion === 'loved') {
            return this.emotionIcons.loved;
        } else if (emotion === 'ok') {
            return this.emotionIcons.ok;
        } else if (emotion === 'stressed') {
            return this.emotionIcons.stressed;
        } else if (emotion === 'sad') {
            return this.emotionIcons.sad;
        } else if (emotion === 'angry') {
            return this.emotionIcons.angry;
        }
    }

    // present a basic alert -- used for displaying gc info
    async presentAlert(header: string, message: any) {
        const alert = await this.alertController.create({
            header,
            message,
            buttons: ['OK']
        });
        await alert.present();
    }

    showToast(msg) {
        this.toastCtrl.create({
            message: msg,
            duration: 2000
        }).then(toast => toast.present());
    }

    showPics() {
        this.showImages = true;
    }

    getProfilePictureChoices() {
        firebase.firestore().collection('settings').doc('userSignUpSettings').get().then((result) => {
            this.allPicURLs = result.get('profilePictures');
        });
    }

    changePic(pic) {
        this.showImages = false;
        this.previewPic = pic;
    }

    editProfile() {
        this.editingMode = true;
    }

    saveProfile() {
        let dateValue = (document.getElementById('newEndRehabDate') as HTMLInputElement).value;
        dateValue = this.datePipe.transform(dateValue, 'y-MM-dd');

        if (dateValue !== this.user.endRehabDate) {
            console.log('date value changed');
            // const newRehabDate = (document.getElementById('newEndRehabDate') as HTMLInputElement).value;
            this.user.endRehabDate = dateValue.split('T')[0];
            const date = new Date(this.user.endRehabDate + 'T12:00:00');
            this.recoveryDate = date;
            this.profileService.updateRecoveryDate(this.user.endRehabDate, this.userProfileID);
        } else {
            console.log('In the else');
        }

        console.log('Out of if');
        const newBio = (document.getElementById('newBio') as HTMLInputElement).value;
        this.user.profilePic = this.previewPic;
        this.user.bio = newBio;
        this.profileService.updateProfilePic(this.user.profilePic, this.userProfileID);
        this.profileService.updateBio(newBio, this.userProfileID);
        this.editingMode = false;
    }

    cancelEdit() {
        this.previewPic = this.user.profilePic;
        this.editingMode = false;
    }
}


