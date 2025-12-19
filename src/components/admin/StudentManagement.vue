<template>
  <div class="student-management">
    <v-container fluid class="pa-0">
      <!-- Enhanced Welcome Section -->
      <div class="welcome-section mt-8 mx-15 mb-8">
        <v-container>
          <v-row align="center" class="py-6">
            <v-col cols="12" md="8">
              <div class="welcome-content">
                <h1 class="welcome-title mb-3">
                  <v-icon icon="mdi-account-group" class="mr-3" color="white" />
                  Öğrenci Yönetimi
                </h1>
                <p class="welcome-subtitle">
                  Öğrenci profillerini, üyeliklerini ve hesap bilgilerini yönetin
                </p>
              </div>
            </v-col>
            <v-col cols="12" md="4" class="text-md-right">
              <div class="date-time-widget">
                <div class="current-date">{{ getCurrentDate() }}</div>
                <div class="current-time">{{ filteredStudents.length }} Öğrenci</div>
              </div>
            </v-col>
          </v-row>
        </v-container>
      </div>

      <v-container>
        <!-- Enhanced Stats Cards -->
        <v-row class="mb-8">
          <v-col cols="12" sm="6" md="3">
            <v-card class="stat-card modern-card" elevation="0">
              <div class="stat-card-overlay"></div>
              <v-card-text class="stat-content">
                <div class="stat-icon-wrapper primary-gradient">
                  <v-icon icon="mdi-account-multiple" size="32" color="white" />
                </div>
                <div class="stat-details">
                  <h3 class="stat-number primary--text">{{ stats.totalStudents }}</h3>
                  <p class="stat-label">Toplam Öğrenci</p>
                  <div class="stat-trend">
                    <v-icon size="16" color="success">mdi-trending-up</v-icon>
                    <span class="trend-text">+{{ stats.newThisMonth }} bu ay</span>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-card class="stat-card modern-card" elevation="0">
              <div class="stat-card-overlay"></div>
              <v-card-text class="stat-content">
                <div class="stat-icon-wrapper success-gradient">
                  <v-icon icon="mdi-account-check" size="32" color="white" />
                </div>
                <div class="stat-details">
                  <h3 class="stat-number success--text">{{ stats.activeStudents }}</h3>
                  <p class="stat-label">Aktif Öğrenci</p>
                  <div class="stat-trend">
                    <v-icon size="16" color="success">mdi-check-circle</v-icon>
                    <span class="trend-text">Bu hafta</span>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-card class="stat-card modern-card" elevation="0">
              <div class="stat-card-overlay"></div>
              <v-card-text class="stat-content">
                <div class="stat-icon-wrapper warning-gradient">
                  <v-icon icon="mdi-account-clock" size="32" color="white" />
                </div>
                <div class="stat-details">
                  <h3 class="stat-number warning--text">{{ stats.inactiveStudents }}</h3>
                  <p class="stat-label">Pasif Öğrenci</p>
                  <div class="stat-trend">
                    <v-icon size="16" color="warning">mdi-clock-alert</v-icon>
                    <span class="trend-text">Bu ay</span>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-card class="stat-card modern-card" elevation="0">
              <div class="stat-card-overlay"></div>
              <v-card-text class="stat-content">
                <div class="stat-icon-wrapper amber-gradient">
                  <v-icon icon="mdi-cash-multiple" size="32" color="white" />
                </div>
                <div class="stat-details">
                  <h3 class="stat-number amber--text">{{ totalBalance.toLocaleString('tr-TR') }}₺</h3>
                  <p class="stat-label">Toplam Bakiye</p>
                  <div class="stat-trend">
                    <v-icon size="16" color="amber">mdi-currency-try</v-icon>
                    <span class="trend-text">Nakit akışı</span>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Enhanced Filters Section -->
        <v-card class="modern-card mb-8" elevation="0">
          <div class="action-card-overlay"></div>
          <v-card-title class="pa-6">
            <div class="d-flex align-center">
              <div class="stat-icon-wrapper info-gradient mr-4" style="width: 48px; height: 48px;">
                <v-icon icon="mdi-filter" size="24" color="white" />
              </div>
              <div>
                <h3 class="text-h6 font-weight-bold mb-0">Filtreler ve Arama</h3>
                <p class="text-body-2 text-grey-600 mb-0">Öğrencileri filtreleyin ve hızlı arama yapın</p>
              </div>
            </div>
          </v-card-title>
          <v-card-text class="pa-6">
            <v-row>
              <v-col cols="12" md="4">
                <v-text-field
                    v-model="filters.search"
                    label="Öğrenci Ara"
                    variant="outlined"
                    prepend-inner-icon="mdi-magnify"
                    density="compact"
                    clearable
                    placeholder="İsim, email veya telefon ara..."
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                    v-model="filters.membership"
                    label="Üyelik Türü"
                    :items="membershipTypes"
                    variant="outlined"
                    density="compact"
                    clearable
                    prepend-inner-icon="mdi-card-account-details"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                    v-model="filters.status"
                    label="Durum"
                    :items="statusOptions"
                    variant="outlined"
                    density="compact"
                    clearable
                    prepend-inner-icon="mdi-account-check"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Enhanced Students Table -->
        <v-card class="modern-card" elevation="0">
          <div class="action-card-overlay"></div>
          <v-card-title class="pa-6 d-flex justify-space-between align-center">
            <div class="d-flex align-center">
              <div class="stat-icon-wrapper success-gradient mr-4" style="width: 48px; height: 48px;">
                <v-icon icon="mdi-table" size="24" color="white" />
              </div>
              <div>
                <h3 class="text-h6 font-weight-bold mb-0">Öğrenci Listesi</h3>
                <p class="text-body-2 text-grey-600 mb-0">Tüm öğrenci bilgileri ve detayları</p>
              </div>
            </div>
            <div class="d-flex  align-center gap-2">
              <v-chip color="success" variant="flat" class="mr-2 font-weight-bold">
                {{ filteredStudents.length }} öğrenci
              </v-chip>
              <v-btn
                  color="success"
                  prepend-icon="mdi-account-plus"
                  @click="openAddStudentDialog"
              >
                Öğrenci Ekle
              </v-btn>
            </div>
          </v-card-title>

          <v-card-text class="pa-0">
            <v-data-table
                :headers="headers"
                :items="filteredStudents"
                :items-per-page="itemsPerPage"
                :loading="loading"
                class="elevation-0"
                loading-text="Öğrenciler yükleniyor..."
                no-data-text="Henüz öğrenci kaydı bulunmamaktadır"
            >
              <template #item.student="{ item }">
                <div class="d-flex align-center py-2">
                  <v-avatar
                      :color="item.status === 'active' ? 'success' : item.status === 'suspended' ? 'error' : 'grey'"
                      class="mr-3"
                      size="40"
                  >
                    <span class="white--text font-weight-bold text-h6">
                      {{ item.firstName?.charAt(0) }}{{ item.lastName?.charAt(0) }}
                    </span>
                  </v-avatar>
                  <div>
                    <div class="font-weight-bold text-body-1">
                      {{ item.firstName }} {{ item.lastName }}
                    </div>
                    <div class="text-body-2 text-grey-600">{{ item.email }}</div>
                  </div>
                </div>
              </template>

              <template #item.membershipType="{ item }">
                <div class="d-flex flex-column align-start">
                  <v-chip
                      :color="getMembershipColor(item.membershipType)"
                      variant="flat"
                      size="small"
                      class="font-weight-bold mb-1"
                  >
                    {{ getMembershipDisplayName(item.membershipType) }}
                  </v-chip>
                  <!-- Grup bilgisi -->
                  <v-chip
                      v-if="isGroupMembership(item.membershipType) && item.groupAssignment"
                      :color="getGroupStatusColor(item.membershipType, item.groupAssignment)"
                      variant="outlined"
                      size="x-small"
                      class="font-weight-medium"
                  >
                    <v-icon start size="12">mdi-account-group</v-icon>
                    {{ getGroupDisplayNameWithCapacity(item.membershipType, item.groupAssignment) }}
                  </v-chip>
                </div>
              </template>

              <template #item.status="{ item }">
                <v-chip
                    :color="getStatusColor(item.status)"
                    variant="flat"
                    size="small"
                    class="font-weight-bold"
                >
                  <v-icon
                      start
                      size="16"
                      :icon="getStatusIcon(item.status)"
                  />
                  {{ getStatusDisplayName(item.status) }}
                </v-chip>
              </template>

              <template #item.joinDate="{ item }">
                <div class="text-body-2">
                  {{ formatDate(item.joinDate) }}
                </div>
              </template>

              <template #item.balance="{ item }">
                <div class="font-weight-bold" :class="getBalanceColor(item.balance)">
                  {{ item.balance?.toLocaleString('tr-TR') }}₺
                </div>
              </template>

              <template #item.actions="{ item }">
                <div class="d-flex justify-center gap-2">
                  <v-btn
                      icon
                      size="small"
                      color="primary"
                      variant="tonal"
                      @click="viewStudentDetails(item)"
                  >
                    <v-icon size="16">mdi-eye</v-icon>
                    <v-tooltip activator="parent" location="top">Profili Görüntüle</v-tooltip>
                  </v-btn>
                  <v-btn
                      class="ml-2"
                      icon
                      size="small"
                      color="error"
                      variant="tonal"
                      @click="deleteStudent(item)"
                  >
                    <v-icon size="16">mdi-delete</v-icon>
                    <v-tooltip activator="parent" location="top">Sil</v-tooltip>
                  </v-btn>
                </div>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-container>
    </v-container>

    <!-- Enhanced Student Details Dialog -->
    <v-dialog
        v-model="showStudentDetailsDialog"
        max-width="900"
        scrollable
    >
      <v-card class="modern-card" elevation="8">
        <v-card-title class="pa-0">
          <div class="welcome-section" style="margin: 0; border-radius: 0;">
            <div class="welcome-content py-6 px-6">
              <div class="d-flex align-center">
                <v-avatar
                    :color="selectedStudent?.status === 'active' ? 'success' : selectedStudent?.status === 'suspended' ? 'error' : 'grey'"
                    class="mr-4"
                    size="56"
                >
                  <span class="white--text font-weight-bold text-h5">
                    {{ selectedStudent?.firstName?.charAt(0) }}{{ selectedStudent?.lastName?.charAt(0) }}
                  </span>
                </v-avatar>
                <div>
                  <h2 class="text-h5 font-weight-bold text-white mb-1">
                    {{ selectedStudent?.firstName }} {{ selectedStudent?.lastName }}
                  </h2>
                  <p class="text-body-1 text-white opacity-90 mb-0">
                    {{ selectedStudent?.email }}
                  </p>
                </div>
                <v-spacer />
                <v-btn
                    icon
                    color="white"
                    variant="text"
                    @click="showStudentDetailsDialog = false"
                >
                  <v-icon>mdi-close</v-icon>
                </v-btn>
              </div>
            </div>
          </div>
        </v-card-title>

        <v-card-text class="pa-0">
          <v-container class="py-6">
            <v-row>
              <!-- Student Info Section -->
              <v-col cols="12" md="6">
                <v-card class="modern-card mb-4" elevation="2">
                  <v-card-title class="pa-4 bg-primary text-white">
                    <v-icon icon="mdi-account-details" class="mr-2" />
                    Kişisel Bilgiler
                  </v-card-title>
                  <v-card-text class="pa-4">
                    <div v-if="!isEditMode">
                      <div class="info-item mb-3">
                        <label class="info-label">Ad Soyad:</label>
                        <span class="info-value">{{ selectedStudent?.firstName }} {{ selectedStudent?.lastName }}</span>
                      </div>
                      <div class="info-item mb-3">
                        <label class="info-label">E-posta:</label>
                        <span class="info-value">{{ selectedStudent?.email }}</span>
                      </div>
                      <div class="info-item mb-3">
                        <label class="info-label">Telefon:</label>
                        <span class="info-value">{{ selectedStudent?.phone }}</span>
                      </div>
                      <div class="info-item mb-3">
                        <label class="info-label">Adres:</label>
                        <span class="info-value">{{ selectedStudent?.address }}</span>
                      </div>
                      <div class="info-item">
                        <label class="info-label">Acil Durum İletişim:</label>
                        <span class="info-value">{{ selectedStudent?.emergencyContact }}</span>
                      </div>
                    </div>
                    <div v-else>
                      <v-text-field
                          v-model="editForm.firstName"
                          label="Ad"
                          variant="outlined"
                          density="compact"
                          class="mb-3"
                      />
                      <v-text-field
                          v-model="editForm.lastName"
                          label="Soyad"
                          variant="outlined"
                          density="compact"
                          class="mb-3"
                      />
                      <v-text-field
                          v-model="editForm.email"
                          label="E-posta"
                          variant="outlined"
                          density="compact"
                          class="mb-3"
                      />
                      <v-text-field
                          v-model="editForm.phone"
                          label="Telefon"
                          variant="outlined"
                          density="compact"
                          class="mb-3"
                      />
                      <v-textarea
                          v-model="editForm.address"
                          label="Adres"
                          variant="outlined"
                          density="compact"
                          rows="2"
                          class="mb-3"
                      />
                      <v-text-field
                          v-model="editForm.emergencyContact"
                          label="Acil Durum İletişim"
                          variant="outlined"
                          density="compact"
                      />
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>

              <!-- Membership & Status Section -->
              <v-col cols="12" md="6">
                <v-card class="modern-card mb-4" elevation="2">
                  <v-card-title class="pa-4 bg-success text-white">
                    <v-icon icon="mdi-card-account-details" class="mr-2" />
                    Üyelik Bilgileri
                  </v-card-title>
                  <v-card-text class="pa-4">
                    <div v-if="!isEditMode">
                      <div class="info-item mb-3">
                        <label class="info-label">Üyelik Türü:</label>
                        <v-chip
                            :color="getMembershipColor(selectedStudent?.membershipType)"
                            variant="flat"
                            size="small"
                            class="font-weight-bold"
                        >
                          {{ getMembershipDisplayName(selectedStudent?.membershipType) }}
                        </v-chip>
                      </div>
                      <!-- Grup bilgisi gösterimi -->
                      <div v-if="isGroupMembership(selectedStudent?.membershipType) && selectedStudent?.groupAssignment" class="info-item mb-3">
                        <label class="info-label">Grup:</label>
                        <div class="d-flex align-center gap-2">
                          <v-chip
                              :color="getGroupStatusColor(selectedStudent?.membershipType, selectedStudent?.groupAssignment)"
                              variant="flat"
                              size="small"
                              class="font-weight-bold"
                          >
                            <v-icon start size="16">mdi-account-group</v-icon>
                            {{ getGroupDisplayNameWithCapacity(selectedStudent?.membershipType, selectedStudent?.groupAssignment) }}
                          </v-chip>

                          <!-- Grup üyelerini göster -->
                          <v-tooltip location="top">
                            <template #activator="{ props }">
                              <v-btn
                                  v-bind="props"
                                  icon="mdi-information-outline"
                                  size="x-small"
                                  variant="text"
                                  color="info"
                                  @click="showGroupMembersDialog(selectedStudent?.membershipType, selectedStudent?.groupAssignment)"
                              />
                            </template>
                            <span>Grup üyelerini görüntüle</span>
                          </v-tooltip>
                        </div>
                      </div>
                      <!-- Grup programı gösterimi -->
                      <div v-if="isGroupMembership(selectedStudent?.membershipType) && selectedStudent?.groupSchedule?.weeklyPlan?.length" class="info-item mb-3">
                        <label class="info-label">Haftalık Program:</label>
                        <div class="mt-2">
                          <v-chip
                              v-for="(plan, index) in selectedStudent.groupSchedule.weeklyPlan"
                              :key="index"
                              color="indigo"
                              variant="flat"
                              size="small"
                              class="mr-2 mb-2"
                          >
                            <v-icon start size="16">mdi-calendar-clock</v-icon>
                            {{ getDayDisplayName(plan.day) }} {{ plan.time }} - {{ getCourtDisplayName(plan.court) }}
                          </v-chip>
                        </div>
                      </div>
                      <div class="info-item mb-3">
                        <label class="info-label">Durum:</label>
                        <v-chip
                            :color="getStatusColor(selectedStudent?.status)"
                            variant="flat"
                            size="small"
                            class="font-weight-bold"
                        >
                          <v-icon
                              start
                              size="16"
                              :icon="getStatusIcon(selectedStudent?.status)"
                          />
                          {{ getStatusDisplayName(selectedStudent?.status) }}
                        </v-chip>
                      </div>
                      <div class="info-item mb-3">
                        <label class="info-label">Kayıt Tarihi:</label>
                        <span class="info-value">{{ formatDate(selectedStudent?.joinDate) }}</span>
                      </div>
                      <div class="info-item">
                        <label class="info-label">Bakiye:</label>
                        <span class="font-weight-bold" :class="getBalanceColor(selectedStudent?.balance)">
                          {{ selectedStudent?.balance?.toLocaleString('tr-TR') }}₺
                        </span>
                      </div>
                    </div>
                    <div v-else>
                      <v-select
                          v-model="editForm.membershipType"
                          label="Üyelik Türü"
                          :items="membershipTypes"
                          variant="outlined"
                          density="compact"
                          class="mb-3"
                          @update:model-value="onMembershipTypeChange"
                      />

                      <!-- Grup seçimi - sadece grup üyeliklerinde göster -->
                      <v-select
                          v-if="isGroupMembership(editForm.membershipType)"
                          v-model="editForm.groupAssignment"
                          label="Grup Seçimi"
                          :items="getGroupOptionsWithCapacity(editForm.membershipType)"
                          item-title="title"
                          item-value="value"
                          variant="outlined"
                          density="compact"
                          class="mb-3"
                          clearable
                          placeholder="Grup seçiniz"
                          @update:model-value="onGroupSelectionChange(editForm.membershipType, $event)"
                      >
                        <template #prepend-inner>
                          <v-icon color="purple">mdi-account-group</v-icon>
                        </template>

                        <!-- Grup seçeneklerini özelleştir -->
                        <template #item="{ props, item }">
                          <v-list-item
                              v-bind="props"
                              :disabled="item.raw.disabled"
                              :color="item.raw.props?.color || 'primary'"
                          >
                            <template #prepend>
                              <v-icon
                                  :color="item.raw.disabled ? 'grey' : item.raw.props?.color || 'primary'"
                                  class="mr-2"
                              >
                                {{ item.raw.disabled ? 'mdi-account-group-outline' : 'mdi-account-group' }}
                              </v-icon>
                            </template>

<!--                            <v-list-item-title>{{ item.raw.title }}</v-list-item-title>
                            <v-list-item-subtitle v-if="item.raw.props?.subtitle">
                              {{ item.raw.props.subtitle }}
                            </v-list-item-subtitle>-->

                            <template #append>
                              <v-chip
                                  v-if="item.raw.disabled"
                                  size="x-small"
                                  color="error"
                                  variant="flat"
                              >
                                DOLU
                              </v-chip>
                              <v-chip
                                  v-else
                                  size="x-small"
                                  :color="item.raw.props?.color || 'success'"
                                  variant="flat"
                              >
                                {{ item.raw.props?.subtitle || 'Müsait' }}
                              </v-chip>
                            </template>
                          </v-list-item>
                        </template>
                      </v-select>

                      <!-- Seçilen grubun detay bilgisi -->
                      <v-alert
                          v-if="editForm.groupAssignment"
                          :color="getGroupStatusColor(editForm.membershipType, editForm.groupAssignment)"
                          variant="tonal"
                          density="compact"
                          class="mb-3"
                      >
                        <template #prepend>
                          <v-icon>mdi-information</v-icon>
                        </template>

                        <div class="d-flex align-center justify-space-between">
                          <div>
                            <strong>Seçilen Grup:</strong> {{ getGroupDisplayNameWithCapacity(editForm.membershipType, editForm.groupAssignment) }}
                          </div>

                          <v-btn
                              size="small"
                              color="info"
                              variant="text"
                              @click="showGroupMembersDialog(editForm.membershipType, editForm.groupAssignment)"
                          >
                            Üyeleri Görüntüle
                          </v-btn>
                        </div>
                      </v-alert>

                      <!-- Haftalık program düzenleyici -->
                      <div v-if="isGroupMembership(editForm.membershipType) && editForm.groupAssignment">
                        <div class="d-flex align-center justify-space-between mb-3">
                          <label class="text-subtitle-1 font-weight-medium">Haftalık Program</label>
                          <v-btn
                              size="small"
                              color="primary"
                              variant="tonal"
                              @click="addDayToPlan"
                              prepend-icon="mdi-plus"
                          >
                            Gün Ekle
                          </v-btn>
                        </div>

                        <!-- Her gün için ayrı seçim -->
                        <v-card
                            v-for="(dayPlan, index) in editForm.weeklyPlan"
                            :key="index"
                            class="mb-3 pa-3"
                            variant="outlined"
                        >
                          <div class="d-flex align-center justify-space-between mb-2">
                            <span class="text-subtitle-2 font-weight-medium">{{ index + 1 }}. Ders Günü</span>
                            <v-btn
                                size="x-small"
                                color="error"
                                variant="text"
                                icon="mdi-delete"
                                @click="removeDayFromPlan(index)"
                            />
                          </div>

                          <v-row dense>
                            <!-- Gün seçimi -->
                            <v-col cols="12">
                              <v-select
                                  v-model="dayPlan.day"
                                  label="Gün"
                                  :items="dayOptions"
                                  variant="outlined"
                                  density="compact"
                                  placeholder="Gün seçiniz"
                              >
                                <template #prepend-inner>
                                  <v-icon color="blue" size="16">mdi-calendar</v-icon>
                                </template>
                              </v-select>
                            </v-col>

                            <!-- Saat seçimi -->
                            <v-col cols="12">
                              <v-select
                                  v-model="dayPlan.time"
                                  label="Saat"
                                  :items="timeOptions"
                                  variant="outlined"
                                  density="compact"
                                  placeholder="Saat seçiniz"
                              >
                                <template #prepend-inner>
                                  <v-icon color="green" size="16">mdi-clock</v-icon>
                                </template>
                              </v-select>
                            </v-col>

                            <!-- Kort seçimi -->
                            <v-col cols="12">
                              <v-select
                                  v-model="dayPlan.court"
                                  label="Kort"
                                  :items="courtOptions"
                                  variant="outlined"
                                  density="compact"
                                  placeholder="Kort seçiniz"
                              >
                                <template #prepend-inner>
                                  <v-icon color="orange" size="16">mdi-tennis-ball</v-icon>
                                </template>
                              </v-select>
                            </v-col>
                          </v-row>

                          <!-- Seçim özeti -->
                          <div v-if="dayPlan.day && dayPlan.time && dayPlan.court" class="mt-2">
                            <v-chip color="success" size="small" variant="flat">
                              <v-icon start size="16">mdi-check</v-icon>
                              {{ getDayDisplayName(dayPlan.day) }} {{ dayPlan.time }} - {{ getCourtDisplayName(dayPlan.court) }}
                            </v-chip>
                          </div>
                        </v-card>

                        <!-- Program özeti -->
                        <div v-if="editForm.weeklyPlan.length > 0" class="my-3">
                          <v-alert
                              color="info"
                              variant="tonal"
                              density="compact"
                              icon="mdi-information"
                          >
                            <strong>Program Özeti:</strong><br>
                            {{ getWeeklyPlanDisplay(editForm.weeklyPlan.filter(p => p.day && p.time && p.court)) }}
                          </v-alert>
                        </div>
                      </div>

                      <v-select
                          v-model="editForm.status"
                          label="Durum"
                          :items="statusOptions"
                          variant="outlined"
                          density="compact"
                          class="mb-3"
                      />
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>

        <v-card-actions class="pa-6 bg-grey-50">
          <div v-if="!isEditMode" class="d-flex w-100 gap-2">
            <v-btn color="primary" variant="flat" @click="toggleEditMode">
              <v-icon icon="mdi-pencil" class="mr-1" />
              Düzenle
            </v-btn>
            <v-btn
                class="ml-1"
              color="success" 
              variant="tonal" 
              @click="handleExportStudentAttendance"
              :loading="exportingAttendance"
            >
              <v-icon icon="mdi-microsoft-excel" class="mr-1" />
              Yoklama İndir
            </v-btn>
            <v-spacer />
            <v-btn color="red" variant="text" @click="showStudentDetailsDialog = false">Kapat</v-btn>
          </div>

          <div v-else class="d-flex w-100 gap-2">
            <v-btn color="success" variant="flat" @click="saveStudentChanges" :loading="savingChanges">
              <v-icon icon="mdi-check" class="mr-1" />
              Kaydet
            </v-btn>
            <v-spacer />
            <v-btn color="grey" variant="flat" @click="cancelEdit">
              <v-icon icon="mdi-close" class="mr-1" />
              İptal
            </v-btn>
          </div>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Grup üyeleri dialog -->
    <v-dialog
        v-model="showGroupMembersDialogState"
        max-width="600"
    >
      <v-card>
        <v-card-title class="pa-4 bg-primary text-white">
          <v-icon icon="mdi-account-group" class="mr-2" />
          Grup Üyeleri
        </v-card-title>

        <v-card-text class="pa-4">
          <div v-if="selectedGroupMembers.length === 0" class="text-center py-8">
            <v-icon size="64" color="grey-400" class="mb-4">mdi-account-group-outline</v-icon>
            <p class="text-grey-600">Bu grupta henüz üye bulunmuyor</p>
          </div>

          <div v-else>
            <div class="mb-4">
              <v-chip :color="getGroupStatusColor(selectedGroupMembershipType, selectedGroupId)" variant="flat" class="font-weight-bold">
                {{ getGroupDisplayNameWithCapacity(selectedGroupMembershipType, selectedGroupId) }}
              </v-chip>
            </div>

            <v-list density="compact">
              <v-list-item
                  v-for="member in selectedGroupMembers"
                  :key="member.id"
                  class="mb-2"
              >
                <template #prepend>
                  <v-avatar
                      :color="member.status === 'active' ? 'success' : 'grey'"
                      size="32"
                  >
                    <span class="text-caption font-weight-bold">
                      {{ member.firstName.charAt(0) }}{{ member.lastName.charAt(0) }}
                    </span>
                  </v-avatar>
                </template>

                <v-list-item-title class="font-weight-medium">
                  {{ member.firstName }} {{ member.lastName }}
                </v-list-item-title>

                <v-list-item-subtitle>
                  {{ member.email }}
                </v-list-item-subtitle>

                <template #append>
                  <v-chip
                      :color="getStatusColor(member.status)"
                      size="small"
                      variant="flat"
                  >
                    {{ getStatusDisplayName(member.status) }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
          </div>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn
              color="primary"
              variant="text"
              @click="showGroupMembersDialogState = false"
          >
            Kapat
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Öğrenci Ekleme Dialog -->
    <v-dialog
        v-model="showAddStudentDialog"
        max-width="700"
        persistent
    >
      <v-card class="modern-card" elevation="8">
        <v-card-title class="pa-0">
          <div class="welcome-section" style="margin: 0; border-radius: 0;">
            <div class="welcome-content py-6 px-6">
              <div class="d-flex align-center justify-space-between">
                <div class="d-flex align-center">
                  <div class="stat-icon-wrapper success-gradient mr-4" style="width: 56px; height: 56px;">
                    <v-icon icon="mdi-account-plus" size="32" color="white" />
                  </div>
                  <div>
                    <h2 class="text-h5 font-weight-bold text-white mb-1">
                      Yeni Öğrenci Ekle
                    </h2>
                    <p class="text-body-1 text-white opacity-90 mb-0">
                      Öğrenci bilgilerini girin ve hesap oluşturun
                    </p>
                  </div>
                </div>
                <v-btn
                    icon
                    color="white"
                    variant="text"
                    @click="closeAddStudentDialog"
                >
                  <v-icon>mdi-close</v-icon>
                </v-btn>
              </div>
            </div>
          </div>
        </v-card-title>

        <v-card-text class="pa-6">
          <v-form ref="addStudentFormRef" v-model="addStudentFormValid">
            <v-row>
              <!-- Ad -->
              <v-col cols="12" md="6">
                <v-text-field
                    v-model="addStudentForm.firstName"
                    label="Ad"
                    variant="outlined"
                    :rules="nameRules"
                    prepend-inner-icon="mdi-account"
                    density="comfortable"
                    required
                />
              </v-col>

              <!-- Soyad -->
              <v-col cols="12" md="6">
                <v-text-field
                    v-model="addStudentForm.lastName"
                    label="Soyad"
                    variant="outlined"
                    :rules="nameRules"
                    density="comfortable"
                    required
                />
              </v-col>

              <!-- E-posta -->
              <v-col cols="12">
                <v-text-field
                    v-model="addStudentForm.email"
                    label="E-posta"
                    type="email"
                    variant="outlined"
                    :rules="emailRules"
                    prepend-inner-icon="mdi-email"
                    density="comfortable"
                    required
                />
              </v-col>

              <!-- Şifre -->
              <v-col cols="12" md="6">
                <v-text-field
                    v-model="addStudentForm.password"
                    label="Şifre"
                    :type="showPassword ? 'text' : 'password'"
                    variant="outlined"
                    :rules="passwordRules"
                    prepend-inner-icon="mdi-lock"
                    :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                    @click:append-inner="showPassword = !showPassword"
                    density="comfortable"
                    required
                />
              </v-col>

              <!-- Şifre Tekrar -->
              <v-col cols="12" md="6">
                <v-text-field
                    v-model="addStudentForm.confirmPassword"
                    label="Şifre Tekrar"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    variant="outlined"
                    :rules="confirmPasswordRules"
                    prepend-inner-icon="mdi-lock-check"
                    :append-inner-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
                    @click:append-inner="showConfirmPassword = !showConfirmPassword"
                    density="comfortable"
                    required
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-6">
          <v-spacer />
          <v-btn
              variant="text"
              @click="closeAddStudentDialog"
          >
            İptal
          </v-btn>
          <v-btn
              color="success"
              variant="flat"
              :loading="savingChanges"
              :disabled="!addStudentFormValid"
              @click="createNewStudent"
              prepend-icon="mdi-check"
          >
            Öğrenci Ekle
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Yoklama Arşivleme Uyarı Dialog -->
    <AttendanceArchiveWarning
        v-model="showArchiveWarningDialog"
        :student-id="archiveWarningData.studentId"
        :student-name="archiveWarningData.studentName"
        :group-id="archiveWarningData.groupId"
        :group-name="archiveWarningData.groupName"
        :attendance-count="archiveWarningData.attendanceCount"
        :archive-reason="archiveWarningData.archiveReason"
        @archive="handleArchiveAndContinue"
        @continue-without-archive="handleContinueWithoutArchive"
        @cancel="handleArchiveCancel"
    />

    <!-- Success Snackbar -->
    <v-snackbar
        v-model="successSnackbar"
        color="success"
        :timeout="3000"
        location="top"
    >
      {{ successMessage }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { collection, deleteDoc, query, where, getDocs, orderBy, doc, updateDoc, serverTimestamp, addDoc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/services/firebase'
import AttendanceArchiveWarning from '@/components/common/AttendanceArchiveWarning.vue'
import {
  checkStudentAttendanceHistory,
  archiveStudentAttendance,
  exportToExcel,
  exportStudentAttendanceToExcel
} from '@/services/attendanceArchive'
import type { ArchiveReason, AttendanceRecord } from '@/types/attendanceArchive'

interface WeeklyPlan {
  day: string
  time: string
  court: string
}

// Define student interface
interface Student {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  emergencyContact: string
  membershipType: string
  groupAssignment?: string
  groupSchedule?: {
    weeklyPlan: Array<{
      day: string
      time: string
      court: string
    }>
  }
  status: 'active' | 'inactive' | 'suspended'
  joinDate: Date
  balance: number
  notes?: string
  role: string
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
}

// Reactive state
const students = ref<Student[]>([])
const groups = ref<any[]>([]) // GroupManagement'tan gelen gerçek gruplar
const loading = ref(false)
const successSnackbar = ref(false)
const successMessage = ref('')
const showStudentDetailsDialog = ref(false)
const showAddStudentDialog = ref(false)
const selectedStudent = ref<Student | null>(null)
const isEditMode = ref(false)
const savingChanges = ref(false)
const itemsPerPage = ref(10)

// Grup üyeleri dialog state'leri
const showGroupMembersDialogState = ref(false)
const selectedGroupMembers = ref<Student[]>([])
const selectedGroupMembershipType = ref('')
const selectedGroupId = ref('')

// Yoklama arşivleme dialog state'leri
const showArchiveWarningDialog = ref(false)
const archiveWarningData = ref({
  studentId: '',
  studentName: '',
  groupId: '',
  groupName: '',
  attendanceCount: 0,
  archiveReason: 'student_deleted' as ArchiveReason,
  attendanceRecords: [] as AttendanceRecord[]
})
const pendingDeleteStudent = ref<Student | null>(null)
const pendingGroupChangeData = ref<{
  oldGroupId: string
  oldGroupName: string
  reason: ArchiveReason
} | null>(null)
const exportingAttendance = ref(false)

// Yeni öğrenci ekleme formu
const addStudentForm = ref({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// Form validation
const addStudentFormValid = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

// Filters
const filters = reactive({
  search: '',
  membership: '',
  status: ''
})

// Edit form
const editForm = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  emergencyContact: '',
  membershipType: '',
  groupAssignment: '',
  weeklyPlan: [] as WeeklyPlan[],
  status: '',
  balance: 0,
  notes: ''
})

// Table headers
const headers = [
  { title: 'Öğrenci', key: 'student', sortable: false },
  { title: 'Üyelik Türü', key: 'membershipType', align: 'center' },
  { title: 'Durum', key: 'status', align: 'center' },
  { title: 'Kayıt Tarihi', key: 'joinDate', align: 'center' },
  { title: 'İşlemler', key: 'actions', sortable: false, align: 'center' }
]

// Options
const membershipTypes = [
  { title: 'Özel Ders 1 Kişi (45dk)', value: 'private_1_45' },
  { title: 'Özel Ders 2 Kişi (60dk)', value: 'private_2_60' },
  { title: 'Özel Grup 3 Kişi (8ders)', value: 'private_group_3_8' },
  { title: 'Özel Grup 4 Kişi (8ders)', value: 'private_group_4_8' },
  { title: 'Özel Paket 1 Kişi (8ders)', value: 'private_package_1_8' },
  { title: 'Özel Paket 2 Kişi (8ders)', value: 'private_package_2_8' },
  { title: 'Yetişkin Grup', value: 'adult_group' },
  { title: 'Tenis Okulu Yaş Grubu', value: 'tennis_school_age' },
  { title: 'Tenis Okulu Performans', value: 'tennis_school_performance' }
]

const statusOptions = [
  { title: 'Aktif', value: 'active' },
  { title: 'Pasif', value: 'inactive' },
  { title: 'Askıda', value: 'suspended' }
]

// Hafta günleri seçenekleri
const dayOptions = [
  { title: 'Pazartesi', value: 'monday' },
  { title: 'Salı', value: 'tuesday' },
  { title: 'Çarşamba', value: 'wednesday' },
  { title: 'Perşembe', value: 'thursday' },
  { title: 'Cuma', value: 'friday' },
  { title: 'Cumartesi', value: 'saturday' },
  { title: 'Pazar', value: 'sunday' }
]

// Saat seçenekleri
const timeOptions = [
  { title: '09:00', value: '09:00' },
  { title: '10:00', value: '10:00' },
  { title: '11:00', value: '11:00' },
  { title: '12:00', value: '12:00' },
  { title: '13:00', value: '13:00' },
  { title: '14:00', value: '14:00' },
  { title: '15:00', value: '15:00' },
  { title: '16:00', value: '16:00' },
  { title: '17:00', value: '17:00' },
  { title: '18:00', value: '18:00' },
  { title: '19:00', value: '19:00' },
  { title: '20:00', value: '20:00' },
  { title: '21:00', value: '21:00' }
]

// Kort seçenekleri
const courtOptions = [
  { title: 'Kort 1', value: 'court-1' },
  { title: 'Kort 2', value: 'court-2' },
  { title: 'Kort 3', value: 'court-3' }
]

// Validation rules
const nameRules = [
  (v: string) => !!v || 'Bu alan gereklidir',
  (v: string) => v.length >= 2 || 'En az 2 karakter olmalıdır'
]

const emailRules = [
  (v: string) => !!v || 'E-posta gereklidir',
  (v: string) => /.+@.+\..+/.test(v) || 'Geçerli bir e-posta adresi giriniz'
]

const passwordRules = [
  (v: string) => !!v || 'Şifre gereklidir',
  (v: string) => v.length >= 6 || 'Şifre en az 6 karakter olmalıdır'
]

const confirmPasswordRules = computed(() => [
  (v: string) => !!v || 'Şifre tekrarı gereklidir',
  (v: string) => v === addStudentForm.value.password || 'Şifreler eşleşmiyor'
])

// Grup kapasitesi bilgilerini almak için computed property
const groupCapacityInfo = computed(() => {
  const capacityMap: { [key: string]: { [key: string]: { current: number, max: number } } } = {}

  // Her üyelik türü için grup kapasitelerini tanımla
  const groupCapacities: { [key: string]: number } = {
    'private_group_3_8': 3,
    'private_group_4_8': 4,
    'adult_group': 8,
    'tennis_school_age': 6,
    'tennis_school_performance': 8
  }

  // Mevcut öğrencileri gruplar halinde say
  students.value.forEach(student => {
    if (student.groupAssignment && isGroupMembership(student.membershipType)) {
      const membershipType = student.membershipType
      const groupId = student.groupAssignment

      if (!capacityMap[membershipType]) {
        capacityMap[membershipType] = {}
      }

      if (!capacityMap[membershipType][groupId]) {
        capacityMap[membershipType][groupId] = {
          current: 0,
          max: groupCapacities[membershipType] || 10
        }
      }

      capacityMap[membershipType][groupId].current++
    }
  })

  return capacityMap
})

// Grup üyelik türlerini kontrol eden fonksiyon
const isGroupMembership = (membershipType: string): boolean => {
  const groupMemberships = [
    'private_group_3_8',
    'private_group_4_8',
    'adult_group',
    'tennis_school_age',
    'tennis_school_performance'
  ]
  return groupMemberships.includes(membershipType)
}

// Grup seçeneklerini kapasite bilgisiyle birlikte getiren fonksiyon
const getGroupOptionsWithCapacity = (membershipType: string) => {
  if (!isGroupMembership(membershipType)) return []

  // GroupManagement'tan gelen gerçek grupları filtrele
  const filteredGroups = groups.value.filter(group => group.membershipType === membershipType)

  // Grupları seçenek formatına dönüştür
  return filteredGroups.map(group => {
    const currentCapacity = group.members?.length || 0
    const maxCapacity = group.maxCapacity || 8
    const isFull = currentCapacity >= maxCapacity

    return {
      title: `${group.name} (${currentCapacity}/${maxCapacity})`,
      value: group.id,
      disabled: isFull,
      props: {
        subtitle: isFull ? 'Grup dolu' : `${maxCapacity - currentCapacity} boş yer`,
        color: isFull ? 'error' : currentCapacity >= maxCapacity * 0.8 ? 'warning' : 'success'
      }
    }
  })
}

// Grup seçimi validasyonu
const validateGroupSelection = (membershipType: string, groupId: string, excludeStudentId?: string): boolean => {
  if (!isGroupMembership(membershipType) || !groupId) return true

  // Gerçek gruptan kapasite bilgisini al
  const group = groups.value.find(g => g.id === groupId)
  if (!group) return false

  const maxCapacity = group.maxCapacity || 8

  // Grup members array'inden mevcut üye sayısını al
  const currentMembers = group.members?.filter((member: any) => member.id !== excludeStudentId).length || 0

  return currentMembers < maxCapacity
}

// Grup kapasitesi kontrol fonksiyonu
const checkGroupCapacity = (membershipType: string, groupId: string): { current: number, max: number, available: number, isFull: boolean } => {
  // Gerçek gruptan kapasite bilgisini al
  const group = groups.value.find(g => g.id === groupId)

  if (!group) {
    return { current: 0, max: 0, available: 0, isFull: true }
  }

  const maxCapacity = group.maxCapacity || 8
  const currentMembers = group.members?.length || 0

  return {
    current: currentMembers,
    max: maxCapacity,
    available: maxCapacity - currentMembers,
    isFull: currentMembers >= maxCapacity
  }
}

// Grup görüntü adını kapasite bilgisiyle getiren fonksiyon
const getGroupDisplayNameWithCapacity = (membershipType: string, groupAssignment: string): string => {
  if (!groupAssignment) return ''

  // Gerçek gruptan isim ve kapasite bilgisini al
  const group = groups.value.find(g => g.id === groupAssignment)

  if (!group) {
    return 'Grup bulunamadı'
  }

  const currentMembers = group.members?.length || 0
  const maxCapacity = group.maxCapacity || 8

  return `${group.name} (${currentMembers}/${maxCapacity})`
}

// Grup üyelerini listeleyen fonksiyon
const getGroupMembers = (membershipType: string, groupId: string): Student[] => {
  // Gerçek gruptan üye ID'lerini al
  const group = groups.value.find(g => g.id === groupId)

  if (!group || !group.members) {
    return []
  }

  // Grup members array'indeki ID'lere göre students listesinden öğrencileri bul
  return students.value.filter(student =>
      group.members.some((member: any) => member.id === student.id)
  )
}

// Grup durumu gösterimi için yardımcı fonksiyon
const getGroupStatusColor = (membershipType: string, groupId: string): string => {
  const capacity = checkGroupCapacity(membershipType, groupId)

  if (capacity.isFull) return 'error'
  if (capacity.current >= capacity.max * 0.8) return 'warning'
  return 'success'
}

// Grup üyeleri dialog fonksiyonu
const showGroupMembersDialog = (membershipType: string, groupId: string) => {
  selectedGroupMembershipType.value = membershipType
  selectedGroupId.value = groupId
  selectedGroupMembers.value = getGroupMembers(membershipType, groupId)
  showGroupMembersDialogState.value = true
}

// Grup seçimi değiştiğinde validasyon
const onGroupSelectionChange = (membershipType: string, groupId: string) => {
  if (!groupId) return true

  const isValid = validateGroupSelection(membershipType, groupId, selectedStudent.value?.id)

  if (!isValid) {
    const capacity = checkGroupCapacity(membershipType, groupId)
    successMessage.value = `Seçilen grup dolu! Mevcut kapasite: ${capacity.current}/${capacity.max}`
    successSnackbar.value = true

    // Geçersiz seçimi temizle
    editForm.value.groupAssignment = ''
    return false
  }

  return true
}

// Üyelik türü değiştiğinde grup seçimini sıfırla
const onMembershipTypeChange = () => {
  if (!isGroupMembership(editForm.value.membershipType)) {
    editForm.value.groupAssignment = ''
    editForm.value.weeklyPlan = []
  }
}

// Günlük program yönetimi
const addDayToPlan = () => {
  editForm.value.weeklyPlan.push({
    day: '',
    time: '',
    court: ''
  })
}

const removeDayFromPlan = async (index: number) => {
  if (!selectedStudent.value) return

  const removedPlan = editForm.value.weeklyPlan[index]
  editForm.value.weeklyPlan.splice(index, 1)

  // Eğer kayıtlı bir öğrenciyse ve silinen planın gün/zaman/kort bilgisi varsa
  if (selectedStudent.value.id && removedPlan.day && removedPlan.time && removedPlan.court) {
    try {
      // İlgili rezervasyonları sil
      const reservationsRef = collection(db, 'reservations')
      const q = query(
          reservationsRef,
          where('studentId', '==', selectedStudent.value.id),
          where('groupSchedule', '==', true),
          where('courtId', '==', removedPlan.court),
          where('startTime', '==', removedPlan.time)
      )

      const querySnapshot = await getDocs(q)
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref))
      await Promise.all(deletePromises)

      // Court schedule'ı güncelle
      const courtId = convertCourtIdToScheduleFormat(removedPlan.court)
      const dateStrings = getReservationDateStrings(selectedStudent.value.joinDate, removedPlan.day)

      const scheduleUpdates = dateStrings.map(async dateString => {
        const docRef = doc(db, 'courtSchedule', dateString)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const schedule = docSnap.data().schedule || {}
          if (schedule[courtId] && schedule[courtId][removedPlan.time] === 'occupied') {
            schedule[courtId][removedPlan.time] = 'available'
            await setDoc(docRef, {
              schedule: schedule,
              lastUpdated: new Date(),
              updatedBy: 'manual-delete'
            })
          }
        }
      })

      await Promise.all(scheduleUpdates)

      console.log('✅ Silinen plan için rezervasyonlar ve court schedule güncellendi')
    } catch (error) {
      console.error('❌ Rezervasyon silinirken hata:', error)
    }
  }
}

// Yardımcı fonksiyonlar
const getReservationDateStrings = (joinDate: Date, dayOfWeek: string) => {
  const dates = getReservationDatesForDay(
      new Date(joinDate),
      new Date(),
      dayOfWeek
  )
  return dates.map(date => date.toISOString().split('T')[0])
}

const getReservationDatesForDay = (startDate: Date, endDate: Date, dayName: string): Date[] => {
  const dayMap: Record<string, number> = {
    'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
    'thursday': 4, 'friday': 5, 'saturday': 6
  }

  const targetDay = dayMap[dayName.toLowerCase()]
  if (targetDay === undefined) return []

  const current = new Date(startDate)
  const dates: Date[] = []

  while (current.getDay() !== targetDay) {
    current.setDate(current.getDate() + 1)
  }

  while (current <= endDate) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 7)
  }

  return dates
}

const convertCourtIdToScheduleFormat = (courtId: string): string => {
  const mapping: { [key: string]: string } = {
    'court-1': 'K1',
    'court-2': 'K2',
    'court-3': 'K3'
  }
  return mapping[courtId] || courtId
}

// Gün isimlerini Türkçe olarak getiren fonksiyon
const getDayDisplayName = (day: string): string => {
  const dayMap: { [key: string]: string } = {
    'monday': 'Pazartesi',
    'tuesday': 'Salı',
    'wednesday': 'Çarşamba',
    'thursday': 'Perşembe',
    'friday': 'Cuma',
    'saturday': 'Cumartesi',
    'sunday': 'Pazar'
  }
  return dayMap[day] || day
}

// Kort isimlerini görüntüleme fonksiyonu
const getCourtDisplayName = (court: string): string => {
  const courtMap: { [key: string]: string } = {
    'court-1': 'Kort 1',
    'court-2': 'Kort 2',
    'court-3': 'Kort 3'
  }
  return courtMap[court] || court
}

// Haftalık programı string olarak gösterme
const getWeeklyPlanDisplay = (weeklyPlan: Array<{day: string, time: string, court: string}>): string => {
  if (!weeklyPlan || weeklyPlan.length === 0) return 'Program belirlenmemiş'

  return weeklyPlan.map(plan =>
      `${getDayDisplayName(plan.day)} ${plan.time} - ${getCourtDisplayName(plan.court)}`
  ).join(', ')
}

// Computed properties
const filteredStudents = computed(() => {
  let filtered = students.value

  if (filters.search) {
    filtered = filtered.filter(student =>
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(filters.search.toLowerCase()) ||
        student.email.toLowerCase().includes(filters.search.toLowerCase()) ||
        student.phone.includes(filters.search)
    )
  }

  if (filters.membership) {
    filtered = filtered.filter(student => student.membershipType === filters.membership)
  }

  if (filters.status) {
    filtered = filtered.filter(student => student.status === filters.status)
  }

  return filtered
})

const stats = computed(() => {
  const total = students.value.length
  const active = students.value.filter(s => s.status === 'active').length
  const inactive = students.value.filter(s => s.status === 'inactive').length

  const now = new Date()
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const newThisMonth = students.value.filter(s =>
      s.joinDate && new Date(s.joinDate) >= thisMonth
  ).length

  return {
    totalStudents: total,
    activeStudents: active,
    inactiveStudents: inactive,
    newThisMonth
  }
})

const totalBalance = computed(() => {
  return students.value.reduce((sum, student) => sum + (student.balance || 0), 0)
})

// Utility functions
const getCurrentDate = () => {
  const now = new Date()
  return now.toLocaleDateString('tr-TR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatDate = (date: any) => {
  if (!date) return '-'
  const d = date.toDate ? date.toDate() : new Date(date)
  return d.toLocaleDateString('tr-TR')
}

const getMembershipColor = (type: string) => {
  const colors: { [key: string]: string } = {
    'basic': 'info',
    'premium': 'warning',
    'vip': 'error',
    'private_1_45': 'purple',
    'private_2_60': 'purple',
    'private_group_3_8': 'indigo',
    'private_group_4_8': 'indigo',
    'private_package_1_8': 'deep-purple',
    'private_package_2_8': 'deep-purple',
    'adult_group': 'teal',
    'tennis_school_age': 'orange',
    'tennis_school_performance': 'red'
  }
  return colors[type] || 'grey'
}

const getMembershipDisplayName = (type: string) => {
  const texts: { [key: string]: string } = {
    'basic': 'Temel',
    'premium': 'Premium',
    'vip': 'VIP',
    'private_1_45': 'Özel Ders 1 Kişi (45dk)',
    'private_2_60': 'Özel Ders 2 Kişi (60dk)',
    'private_group_3_8': 'Özel Grup 3 Kişi (8ders)',
    'private_group_4_8': 'Özel Grup 4 Kişi (8ders)',
    'private_package_1_8': 'Özel Paket 1 Kişi (8ders)',
    'private_package_2_8': 'Özel Paket 2 Kişi (8ders)',
    'adult_group': 'Yetişkin Grup',
    'tennis_school_age': 'Tenis Okulu Yaş Grubu',
    'tennis_school_performance': 'Tenis Okulu Performans'
  }
  return texts[type] || type || 'Belirtilmemiş'
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'success'
    case 'inactive': return 'grey'
    case 'suspended': return 'error'
    default: return 'grey'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'active': return 'mdi-check-circle'
    case 'inactive': return 'mdi-pause-circle'
    case 'suspended': return 'mdi-cancel'
    default: return 'mdi-help-circle'
  }
}

const getStatusDisplayName = (status: string) => {
  switch (status) {
    case 'active': return 'Aktif'
    case 'inactive': return 'Pasif'
    case 'suspended': return 'Askıda'
    default: return status
  }
}

const getBalanceColor = (balance: number) => {
  if (balance > 0) return 'text-success'
  if (balance < 0) return 'text-error'
  return 'text-grey-600'
}

// Rezervasyon oluşturma fonksiyonları
const createGroupReservations = async (student: Student, weeklyPlan: WeeklyPlan[]): Promise<void> => {
  try {
    const today = new Date()
    const endDate = new Date()
    endDate.setMonth(today.getMonth() + 3) // 3 ay ileri

    for (const plan of weeklyPlan) {
      const dates = getReservationDatesForDay(new Date(student.joinDate), endDate, plan.day)
      const courtId = convertCourtIdToScheduleFormat(plan.court)

      await Promise.all(dates.map(async date => {
        const reservationData = {
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          courtId: plan.court,
          courtName: `Kort ${plan.court.split('-')[1]}`,
          date,
          startTime: plan.time,
          endTime: `${parseInt(plan.time.split(':')[0]) + 1}:00`,
          duration: 60,
          type: 'group-lesson',
          status: 'confirmed',
          groupId: student.groupAssignment,
          membershipType: student.membershipType,
          groupSchedule: true,
          createdAt: new Date()
        }

        await addDoc(collection(db, 'reservations'), reservationData)

        // Court schedule'ı güncelle - ENHANCED VERSION
        const dateString = date.toISOString().split('T')[0]
        const docRef = doc(db, 'courtSchedule', dateString)
        const docSnap = await getDoc(docRef)

        const schedule = docSnap.exists() ? docSnap.data().schedule || {} : {}
        if (!schedule[courtId]) schedule[courtId] = {}

        // ÖNCEKİ HALİ: schedule[courtId][plan.time] = 'occupied'
        // YENİ HAL: Detaylı rezervasyon bilgisi
        schedule[courtId][plan.time] = {
          status: 'occupied',
          studentId: student.id,
          studentFirstName: student.firstName,
          studentLastName: student.lastName,
          studentFullName: `${student.firstName} ${student.lastName}`,
          groupAssignment: student.groupAssignment,
          membershipType: student.membershipType,
          reservationType: 'group-lesson',
          updatedAt: new Date(),
          updatedBy: 'system-reservation'
        }

        await setDoc(docRef, {
          schedule,
          lastUpdated: new Date(),
          updatedBy: 'system-reservation'
        })
      }))
    }
  } catch (error) {
    console.error('Rezervasyon oluşturma hatası:', error)
    throw error
  }
}
const deleteGroupReservations = async (student: Student) => {
  if (!student.groupSchedule?.weeklyPlan || student.groupSchedule.weeklyPlan.length === 0) {
    return
  }

  try {
    console.log('🗑️ Grup rezervasyonları siliniyor...', { student: student.id })

    // Rezervasyonları sil
    const reservationsRef = collection(db, 'reservations')
    const q = query(
        reservationsRef,
        where('studentId', '==', student.id),
        where('groupSchedule', '==', true)
    )

    const querySnapshot = await getDocs(q)
    querySnapshot.forEach(async (doc) => {
      await deleteDoc(doc.ref)
      console.log(`✅ Rezervasyon silindi: ${doc.id}`)
    })

    // Court schedule'dan ilgili slotları temizle
    await clearCourtScheduleSlots(student)

    console.log('✅ Tüm grup rezervasyonları başarıyla silindi')

  } catch (error) {
    console.error('❌ Grup rezervasyonları silinirken hata:', error)
    throw error
  }
}

const clearCourtScheduleSlots = async (student: Student) => {
  if (!student.groupSchedule?.weeklyPlan) return

  try {
    console.log('🔄 Court schedule güncelleniyor...')

    for (const plan of student.groupSchedule.weeklyPlan) {
      if (plan.day && plan.time && plan.court) {
        const reservationDates = getReservationDatesForDay(
            new Date(student.joinDate),
            new Date(),
            plan.day
        )

        for (const date of reservationDates) {
          const dateString = date.toISOString().split('T')[0]
          const docRef = doc(db, 'courtSchedule', dateString)
          const docSnap = await getDoc(docRef)

          if (docSnap.exists()) {
            const schedule = docSnap.data().schedule || {}
            const courtId = convertCourtIdToScheduleFormat(plan.court)

            // Önce bu slotun bu öğrenciye ait olup olmadığını kontrol et
            const currentSlot = schedule[courtId]?.[plan.time]

            if (currentSlot &&
                (currentSlot === 'occupied' || // Eski format
                    (typeof currentSlot === 'object' && currentSlot.studentId === student.id))) { // Yeni format

              // ÖNCEKİ HAL: schedule[courtId][plan.time] = 'available'
              // YENİ HAL: Slot'u temizle
              schedule[courtId][plan.time] = 'available'

              await setDoc(docRef, {
                schedule: schedule,
                lastUpdated: new Date(),
                updatedBy: 'group-lesson-auto-delete'
              })

              console.log(`✅ Court schedule güncellendi: ${dateString} ${courtId} ${plan.time}`)
            }
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Court schedule güncellerken hata:', error)
  }
}

// Belirli bir plan için rezervasyonları sil
const deleteReservationsForPlan = async (studentId: string, plan: WeeklyPlan, joinDate: Date): Promise<void> => {
  try {
    // 1. Rezervasyonları sil
    const reservationsRef = collection(db, 'reservations')
    const q = query(
        reservationsRef,
        where('studentId', '==', studentId),
        where('groupSchedule', '==', true),
        where('courtId', '==', plan.court),
        where('startTime', '==', plan.time)
    )

    const querySnapshot = await getDocs(q)
    const reservationDeletes = querySnapshot.docs.map(async (doc: any) => {
      const reservationData = doc.data()
      const reservationDate = reservationData.date.toDate()
      const dateString = reservationDate.toISOString().split('T')[0]

      await deleteDoc(doc.ref)

      // Court schedule'ı güncelle
      const courtId = convertCourtIdToScheduleFormat(plan.court)
      const courtScheduleRef = doc(db, 'courtSchedule', dateString)
      const courtScheduleSnap: any = await getDoc(courtScheduleRef)

      if (courtScheduleSnap.exists()) {
        const schedule = courtScheduleSnap.data().schedule || {}
        const currentSlot = schedule[courtId]?.[plan.time]

        // Bu slotun bu öğrenciye ait olup olmadığını kontrol et
        if (currentSlot &&
            (currentSlot === 'occupied' || // Eski format
                (typeof currentSlot === 'object' && currentSlot.studentId === studentId))) { // Yeni format

          schedule[courtId][plan.time] = 'available'
          await setDoc(courtScheduleRef, {
            schedule,
            lastUpdated: new Date(),
            updatedBy: 'system-delete'
          })
        }
      }
    })

    await Promise.all(reservationDeletes)

    // 2. Geçmiş tarihlerdeki court schedule'ı da temizle
    const today = new Date()
    const dates = getReservationDatesForDay(new Date(joinDate), today, plan.day)

    const scheduleUpdates = dates.map(async date => {
      const dateString = date.toISOString().split('T')[0]
      const docRef = doc(db, 'courtSchedule', dateString)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const schedule = docSnap.data().schedule || {}
        const courtId = convertCourtIdToScheduleFormat(plan.court)
        const currentSlot = schedule[courtId]?.[plan.time]

        // Bu slotun bu öğrenciye ait olup olmadığını kontrol et
        if (currentSlot &&
            (currentSlot === 'occupied' || // Eski format
                (typeof currentSlot === 'object' && currentSlot.studentId === studentId))) { // Yeni format

          schedule[courtId][plan.time] = 'available'
          await setDoc(docRef, {
            schedule,
            lastUpdated: new Date(),
            updatedBy: 'system-cleanup'
          })
        }
      }
    })

    await Promise.all(scheduleUpdates)

    console.log(`✅ Tüm rezervasyonlar ve court schedule temizlendi: ${plan.day} ${plan.time} ${plan.court}`)
  } catch (error) {
    console.error(`❌ Temizleme işlemi sırasında hata:`, error)
    throw error
  }
}
const getCourtScheduleWithDetails = async (dateString: string) => {
  try {
    const docRef = doc(db, 'courtSchedule', dateString)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const data = docSnap.data()
      return data.schedule || {}
    }

    return {}
  } catch (error) {
    console.error('Court schedule okuma hatası:', error)
    return {}
  }
}

// 5. Belirli bir slot için rezervasyon detaylarını al
const getSlotDetails = (schedule: any, courtId: string, timeSlot: string) => {
  const slot = schedule[courtId]?.[timeSlot]

  if (!slot) {
    return { status: 'available', details: null }
  }

  if (slot === 'available') {
    return { status: 'available', details: null }
  }

  if (slot === 'occupied') {
    // Eski format - sadece durum bilgisi
    return { status: 'occupied', details: { legacy: true } }
  }

  if (typeof slot === 'object') {
    // Yeni format - detaylı bilgi
    return {
      status: slot.status || 'occupied',
      details: {
        studentId: slot.studentId,
        studentFirstName: slot.studentFirstName,
        studentLastName: slot.studentLastName,
        studentFullName: slot.studentFullName,
        groupAssignment: slot.groupAssignment,
        membershipType: slot.membershipType,
        reservationType: slot.reservationType,
        updatedAt: slot.updatedAt,
        updatedBy: slot.updatedBy
      }
    }
  }

  return { status: 'unknown', details: null }
}

const getGroupReservations = async (membershipType: string, groupId: string) => {
  try {
    const reservationsRef = collection(db, 'reservations')
    const q = query(
        reservationsRef,
        where('membershipType', '==', membershipType),
        where('groupId', '==', groupId),
        where('groupSchedule', '==', true),
        orderBy('date', 'asc')
    )

    const querySnapshot = await getDocs(q)
    const reservations: any[] = []

    querySnapshot.forEach((doc) => {
      reservations.push({
        id: doc.id,
        ...doc.data()
      })
    })

    return reservations
  } catch (error) {
    console.error('Grup rezervasyonları getirme hatası:', error)
    return []
  }
}

// 7. Çakışma kontrolü için gelişmiş fonksiyon
const checkScheduleConflict = async (
    courtId: string,
    timeSlot: string,
    dateString: string,
    excludeStudentId?: string
) => {
  try {
    const schedule = await getCourtScheduleWithDetails(dateString)
    const slotInfo = getSlotDetails(schedule, courtId, timeSlot)

    if (slotInfo.status === 'available') {
      return { hasConflict: false, details: null }
    }

    if (slotInfo.details && slotInfo.details.studentId === excludeStudentId) {
      // Aynı öğrencinin kendi rezervasyonu - çakışma yok
      return { hasConflict: false, details: slotInfo.details }
    }

    return {
      hasConflict: true,
      details: slotInfo.details,
      conflictInfo: slotInfo.details ? {
        studentName: slotInfo.details.studentFullName,
        groupAssignment: slotInfo.details.groupAssignment,
        membershipType: slotInfo.details.membershipType
      } : { legacy: true }
    }
  } catch (error) {
    console.error('Çakışma kontrolü hatası:', error)
    return { hasConflict: true, details: null }
  }
}
// Fetch students from Firebase
const fetchStudents = async () => {
  loading.value = true

  try {
    console.log('🔍 Firebase\'den öğrenciler getiriliyor...')

    const usersRef = collection(db, 'users')
    const q = query(usersRef, where('role', '==', 'student'))

    const querySnapshot = await getDocs(q)
    const fetchedStudents: Student[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()

      // Silinmiş öğrencileri atla
      if (data.deleted === true) {
        console.log('⏭️ Silinmiş öğrenci atlandı:', data.email)
        return
      }

      console.log('📄 Öğrenci verisi:', data)

      const student: Student = {
        id: doc.id,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        emergencyContact: data.emergencyContact || '',
        membershipType: data.membershipType || 'basic',
        groupAssignment: data.groupAssignment || '',
        groupSchedule: data.groupSchedule || undefined,
        status: data.status || 'active',
        joinDate: data.createdAt?.toDate() || new Date(),
        balance: data.balance || 0,
        notes: data.notes || '',
        role: data.role,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        lastLoginAt: data.lastLoginAt?.toDate()
      }

      fetchedStudents.push(student)
    })

    fetchedStudents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    students.value = fetchedStudents
    console.log(`✅ ${fetchedStudents.length} öğrenci başarıyla yüklendi`)

    if (fetchedStudents.length === 0) {
      successMessage.value = 'Henüz kayıtlı öğrenci bulunmuyor'
      successSnackbar.value = true
    }

  } catch (error: any) {
    console.error('❌ Öğrencileri yükleme hatası:', error)
    successMessage.value = 'Öğrenciler yüklenirken hata oluştu: ' + error.message
    successSnackbar.value = true
  } finally {
    loading.value = false
  }
}

// Fetch groups from Firebase
const fetchGroups = async () => {
  try {
    console.log('🔍 Firebase\'den gruplar getiriliyor...')
    const groupsRef = collection(db, 'groups')
    const querySnapshot = await getDocs(groupsRef)

    const fetchedGroups: any[] = []
    querySnapshot.forEach((doc) => {
      fetchedGroups.push({
        id: doc.id,
        ...doc.data()
      })
    })

    groups.value = fetchedGroups
    console.log(`✅ ${fetchedGroups.length} grup başarıyla yüklendi`)
  } catch (error: any) {
    console.error('❌ Grupları yükleme hatası:', error)
  }
}

// Öğrenci ekleme dialog'unu aç
const openAddStudentDialog = () => {
  addStudentForm.value = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  }
  showAddStudentDialog.value = true
}

// Öğrenci ekleme dialog'unu kapat
const closeAddStudentDialog = () => {
  showAddStudentDialog.value = false
  addStudentForm.value = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  }
}

// Yeni öğrenci kaydet
const createNewStudent = async () => {
  if (!addStudentFormValid.value) return

  savingChanges.value = true

  try {
    // Önce silinmiş bir kullanıcı olup olmadığını kontrol et
    const usersRef = collection(db, 'users')
    const emailQuery = query(usersRef, where('email', '==', addStudentForm.value.email))
    const emailSnapshot = await getDocs(emailQuery)

    let reactivatedUser = false

    if (!emailSnapshot.empty) {
      // E-posta ile bir kullanıcı bulundu
      const existingUserDoc = emailSnapshot.docs[0]
      const existingUserData = existingUserDoc.data()

      if (existingUserData.deleted === true) {
        // Silinmiş kullanıcıyı yeniden aktif et
        console.log('🔄 Silinmiş öğrenci yeniden aktif ediliyor:', existingUserData.email)

        await updateDoc(existingUserDoc.ref, {
          firstName: addStudentForm.value.firstName,
          lastName: addStudentForm.value.lastName,
          deleted: false,
          deletedAt: null,
          status: 'active',
          updatedAt: serverTimestamp()
        })

        reactivatedUser = true
        successMessage.value = 'Daha önce silinmiş öğrenci yeniden aktif edildi!'
      } else {
        // Kullanıcı aktif ve zaten var
        throw new Error('Bu e-posta adresi zaten kullanılıyor!')
      }
    }

    if (!reactivatedUser) {
      // Yeni öğrenci oluştur
      const { createUserWithEmailAndPassword, getAuth } = await import('firebase/auth')
      const { initializeApp, deleteApp } = await import('firebase/app')
      const { auth, default: app } = await import('@/services/firebase')

      const currentUser = auth.currentUser
      if (!currentUser) {
        throw new Error('Admin kullanıcısı bulunamadı!')
      }

      // İkinci bir Firebase Auth instance oluştur
      const appOptions = (app as any).options || app
      const secondaryApp = initializeApp(appOptions, 'Secondary')
      const secondaryAuth = getAuth(secondaryApp)

      // İkinci instance ile yeni öğrenci oluştur
      const userCredential = await createUserWithEmailAndPassword(
          secondaryAuth,
          addStudentForm.value.email,
          addStudentForm.value.password
      )

      // Firestore'a öğrenci bilgilerini kaydet
      const userDocRef = doc(db, 'users', userCredential.user.uid)
      await setDoc(userDocRef, {
        firstName: addStudentForm.value.firstName,
        lastName: addStudentForm.value.lastName,
        email: addStudentForm.value.email,
        phone: '',
        address: '',
        emergencyContact: '',
        membershipType: 'basic',
        role: 'student',
        status: 'active',
        balance: 0,
        deleted: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      // İkinci instance'ı temizle
      await secondaryAuth.signOut()
      await deleteApp(secondaryApp)

      successMessage.value = 'Öğrenci başarıyla oluşturuldu!'
    }

    // Local state'i güncelle
    await fetchStudents()

    successSnackbar.value = true
    closeAddStudentDialog()
  } catch (error: any) {
    console.error('Öğrenci oluşturma hatası:', error)

    let errorMessage = 'Öğrenci oluşturulurken hata oluştu!'

    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'Bu e-posta adresi zaten kullanılıyor!'
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Geçersiz e-posta adresi!'
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Şifre çok zayıf!'
    } else if (error.message) {
      errorMessage = error.message
    }

    successMessage.value = errorMessage
    successSnackbar.value = true
  } finally {
    savingChanges.value = false
  }
}

const viewStudentDetails = (student: Student) => {
  console.log('Öğrenci detayları görüntüle:', student)
  selectedStudent.value = student
  showStudentDetailsDialog.value = true
  isEditMode.value = false
}

const toggleEditMode = () => {
  if (!isEditMode.value && selectedStudent.value) {
    editForm.value = {
      firstName: selectedStudent.value.firstName,
      lastName: selectedStudent.value.lastName,
      email: selectedStudent.value.email,
      phone: selectedStudent.value.phone,
      address: selectedStudent.value.address,
      emergencyContact: selectedStudent.value.emergencyContact,
      membershipType: selectedStudent.value.membershipType,
      groupAssignment: selectedStudent.value.groupAssignment || '',
      weeklyPlan: selectedStudent.value.groupSchedule?.weeklyPlan || [],
      status: selectedStudent.value.status,
      balance: selectedStudent.value.balance,
      notes: selectedStudent.value.notes || ''
    }
  }
  isEditMode.value = !isEditMode.value
}

const cancelEdit = () => {
  isEditMode.value = false
  editForm.value = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    emergencyContact: '',
    membershipType: '',
    groupAssignment: '',
    weeklyPlan: [],
    status: 'active',
    balance: 0,
    notes: ''
  }
}

const saveStudentChanges = async (): Promise<void> => {
  if (!selectedStudent.value) return

  // Grup seçimi validasyonu
  if (editForm.value.groupAssignment) {
    const isValid = validateGroupSelection(
        editForm.value.membershipType,
        editForm.value.groupAssignment,
        selectedStudent.value.id
    )

    if (!isValid) {
      const capacity = checkGroupCapacity(editForm.value.membershipType, editForm.value.groupAssignment)
      successMessage.value = `Grup kapasitesi dolu! Mevcut: ${capacity.current}/${capacity.max}`
      successSnackbar.value = true
      return
    }
  }

  const oldStudent = selectedStudent.value
  const validWeeklyPlan = editForm.value.weeklyPlan.filter(p => p.day && p.time && p.court)
  const isGroup = isGroupMembership(editForm.value.membershipType)
  const groupAssignment:any = isGroup ? editForm.value.groupAssignment : null
  const hadGroup = oldStudent.groupAssignment
  const hasGroup = groupAssignment

  // Grup değişikliği kontrolü - Eğer gruptan çıkarılıyorsa veya grup değişiyorsa yoklama arşivle
  const groupBeingRemoved = hadGroup && !hasGroup
  const groupBeingChanged = hadGroup && hasGroup && groupAssignment !== oldStudent.groupAssignment

  if (groupBeingRemoved || groupBeingChanged) {
    // Yoklama geçmişini kontrol et
    const { hasHistory, attendanceCount, records } = await checkStudentAttendanceHistory(oldStudent.id)

    if (hasHistory) {
      // Eski grup bilgisini al
      const oldGroup = groups.value.find(g => g.id === oldStudent.groupAssignment)
      
      // Arşivle
      await archiveStudentAttendance(
        oldStudent.id,
        `${oldStudent.firstName} ${oldStudent.lastName}`,
        oldStudent.groupAssignment,
        oldGroup?.name || '',
        oldStudent.membershipType,
        groupBeingRemoved ? 'removed_from_group' : 'group_changed'
      )
      console.log('✅ Grup değişikliği öncesi yoklama arşivlendi')
    }
  }

  savingChanges.value = true

  try {
    const studentId = selectedStudent.value.id
    const groupSchedule:any = isGroup && groupAssignment ? { weeklyPlan: validWeeklyPlan } : null

    const groupChanged = hadGroup && hasGroup &&
        (groupAssignment !== oldStudent.groupAssignment ||
            JSON.stringify(validWeeklyPlan) !== JSON.stringify(oldStudent.groupSchedule?.weeklyPlan || []))

    // 1. Grup kaldırıldıysa veya değiştirildiyse eski rezervasyonları sil
    if ((hadGroup && !hasGroup) || groupChanged) {
      if (oldStudent.groupSchedule?.weeklyPlan) {
        await Promise.all(
            oldStudent.groupSchedule.weeklyPlan.map(plan =>
                deleteReservationsForPlan(studentId, plan, oldStudent.joinDate)
            )
        )
      }
    }
    // 2. Silinen planları temizle (grup aynı kalsa bile)
    if (hadGroup && hasGroup && oldStudent.groupSchedule?.weeklyPlan) {
      const removedPlans = oldStudent.groupSchedule.weeklyPlan.filter(oldPlan =>
          !validWeeklyPlan.some(newPlan =>
              newPlan.day === oldPlan.day &&
              newPlan.time === oldPlan.time &&
              newPlan.court === oldPlan.court
          )
      )

      await Promise.all(
          removedPlans.map(plan =>
              deleteReservationsForPlan(studentId, plan, oldStudent.joinDate)
          )
      )
    }

    // 3. Öğrenci bilgilerini güncelle
    const userDocRef = doc(db, 'users', studentId)
    await updateDoc(userDocRef, {
      firstName: editForm.value.firstName,
      lastName: editForm.value.lastName,
      email: editForm.value.email,
      phone: editForm.value.phone,
      address: editForm.value.address,
      emergencyContact: editForm.value.emergencyContact,
      membershipType: editForm.value.membershipType,
      groupAssignment,
      groupSchedule,
      status: editForm.value.status,
      balance: editForm.value.balance,
      notes: editForm.value.notes,
      updatedAt: serverTimestamp()
    })

    // 4. Yeni grup rezervasyonları oluştur
    if (groupSchedule && validWeeklyPlan.length > 0) {
      await createGroupReservations({
        ...oldStudent,
        groupAssignment,
        groupSchedule
      }, validWeeklyPlan)
    }

    // 4.5. Grup members array'ini güncelle
    // Eski gruptan çıkar (grup kaldırıldıysa veya değiştirildiyse)
    if (hadGroup && oldStudent.groupAssignment && (groupAssignment !== oldStudent.groupAssignment)) {
      const oldGroupRef = doc(db, 'groups', oldStudent.groupAssignment)
      const oldGroupSnap = await getDoc(oldGroupRef)

      if (oldGroupSnap.exists()) {
        const oldGroupData = oldGroupSnap.data()
        const updatedMembers = (oldGroupData.members || []).filter((m: any) => m.id !== studentId)

        await updateDoc(oldGroupRef, {
          members: updatedMembers
        })
      }
    }

    // Yeni gruba ekle (yeni grup atandıysa veya grup değiştirildiyse)
    if (hasGroup && groupAssignment) {
      const newGroupRef = doc(db, 'groups', groupAssignment)
      const newGroupSnap = await getDoc(newGroupRef)

      if (newGroupSnap.exists()) {
        const newGroupData = newGroupSnap.data()
        const existingMembers = newGroupData.members || []

        // Öğrenci zaten grupta değilse ekle
        const alreadyInGroup = existingMembers.some((m: any) => m.id === studentId)

        if (!alreadyInGroup) {
          const memberData = {
            id: studentId,
            name: `${editForm.value.firstName} ${editForm.value.lastName}`,
            email: editForm.value.email
          }

          await updateDoc(newGroupRef, {
            members: [...existingMembers, memberData]
          })
        }
      }
    }

    // Grupları yeniden yükle
    await fetchGroups()

    // 5. Local state'i güncelle
    const index = students.value.findIndex(s => s.id === studentId)
    if (index > -1) {
      students.value[index] = {
        ...oldStudent,
        firstName: editForm.value.firstName,
        lastName: editForm.value.lastName,
        email: editForm.value.email,
        phone: editForm.value.phone,
        address: editForm.value.address,
        emergencyContact: editForm.value.emergencyContact,
        membershipType: editForm.value.membershipType,
        groupAssignment,
        groupSchedule,
        status: editForm.value.status as 'active' | 'inactive' | 'suspended',
        balance: editForm.value.balance,
        notes: editForm.value.notes,
        updatedAt: new Date()
      }
    }

    successMessage.value = 'Öğrenci bilgileri başarıyla güncellendi!'
    successSnackbar.value = true
    isEditMode.value = false
  } catch (error) {
    console.error('Öğrenci güncelleme hatası:', error)
    successMessage.value = 'Öğrenci güncellenirken hata oluştu!'
    successSnackbar.value = true
  } finally {
    savingChanges.value = false
  }
}

const deleteStudent = async (student: Student): Promise<void> => {
  // Önce yoklama geçmişini kontrol et
  const { hasHistory, attendanceCount, records } = await checkStudentAttendanceHistory(student.id)

  if (hasHistory) {
    // Yoklama geçmişi varsa uyarı dialog'u göster
    const group = groups.value.find(g => g.id === student.groupAssignment)
    
    archiveWarningData.value = {
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      groupId: student.groupAssignment || '',
      groupName: group?.name || '',
      attendanceCount,
      archiveReason: 'student_deleted',
      attendanceRecords: records.map(r => ({
        date: r.date,
        present: r.present,
        lessonNumber: r.lessonNumber
      }))
    }
    pendingDeleteStudent.value = student
    showArchiveWarningDialog.value = true
    return
  }

  // Yoklama geçmişi yoksa direkt silme işlemine devam et
  if (!confirm(`${student.firstName} ${student.lastName} adlı öğrenciyi silmek istediğinizden emin misiniz?\n\nÖğrenci listesinden kaldırılacaktır.`)) {
    return
  }

  await performStudentDelete(student)
}

// Öğrenci silme işlemini gerçekleştir
const performStudentDelete = async (student: Student): Promise<void> => {
  savingChanges.value = true

  try {
    console.log('🗑️ Öğrenci siliniyor (soft delete):', student.id)

    // Firestore'da öğrenciyi "deleted" olarak işaretle
    const userDocRef = doc(db, 'users', student.id)
    await updateDoc(userDocRef, {
      deleted: true,
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    console.log('✅ Öğrenci silindi (soft delete)')

    // Öğrenciyi gruplardan çıkar
    const groupsRef = collection(db, 'groups')
    const groupsSnapshot = await getDocs(groupsRef)

    const updatePromises: Promise<void>[] = []
    groupsSnapshot.forEach((groupDoc) => {
      const groupData = groupDoc.data()
      if (groupData.members && Array.isArray(groupData.members)) {
        const updatedMembers = groupData.members.filter((m: any) => m.id !== student.id)
        if (updatedMembers.length !== groupData.members.length) {
          updatePromises.push(updateDoc(groupDoc.ref, { members: updatedMembers }))
        }
      }
    })

    await Promise.all(updatePromises)

    // Grupları yeniden yükle
    await fetchGroups()

    // Local state'i güncelle
    students.value = students.value.filter(s => s.id !== student.id)
    showStudentDetailsDialog.value = false

    successMessage.value = 'Öğrenci başarıyla silindi!'
    successSnackbar.value = true
  } catch (error: any) {
    console.error('Öğrenci silme hatası:', error)

    let errorMessage = 'Öğrenci silinirken hata oluştu!'

    if (error.message) {
      errorMessage = error.message
    }

    successMessage.value = errorMessage
    successSnackbar.value = true
  } finally {
    savingChanges.value = false
  }
}

// Arşivle ve devam et
const handleArchiveAndContinue = async (exportFirst: boolean) => {
  if (!pendingDeleteStudent.value) {
    showArchiveWarningDialog.value = false
    return
  }

  try {
    savingChanges.value = true
    const student = pendingDeleteStudent.value
    const data = archiveWarningData.value

    // Excel export istendiyse önce indir
    if (exportFirst && data.attendanceRecords.length > 0) {
      await exportToExcel(data.studentName, data.attendanceRecords)
    }

    // Yoklama arşivle
    await archiveStudentAttendance(
      student.id,
      `${student.firstName} ${student.lastName}`,
      student.groupAssignment,
      data.groupName,
      student.membershipType,
      'student_deleted'
    )

    // Öğrenciyi sil
    await performStudentDelete(student)

    successMessage.value = 'Yoklama arşivlendi ve öğrenci silindi!'
    successSnackbar.value = true
  } catch (error: any) {
    console.error('Arşivleme hatası:', error)
    successMessage.value = 'Arşivleme sırasında hata oluştu!'
    successSnackbar.value = true
  } finally {
    showArchiveWarningDialog.value = false
    pendingDeleteStudent.value = null
    savingChanges.value = false
  }
}

// Arşivlemeden devam et
const handleContinueWithoutArchive = async () => {
  if (!pendingDeleteStudent.value) {
    showArchiveWarningDialog.value = false
    return
  }

  try {
    await performStudentDelete(pendingDeleteStudent.value)
  } finally {
    showArchiveWarningDialog.value = false
    pendingDeleteStudent.value = null
  }
}

// Arşivleme iptal
const handleArchiveCancel = () => {
  showArchiveWarningDialog.value = false
  pendingDeleteStudent.value = null
  pendingGroupChangeData.value = null
}

// Manuel yoklama export
const handleExportStudentAttendance = async () => {
  if (!selectedStudent.value) return

  try {
    exportingAttendance.value = true
    const student = selectedStudent.value
    const result = await exportStudentAttendanceToExcel(
      student.id,
      `${student.firstName} ${student.lastName}`
    )

    if (result) {
      successMessage.value = 'Yoklama verileri başarıyla indirildi!'
    } else {
      successMessage.value = 'Bu öğrenci için yoklama kaydı bulunamadı.'
    }
    successSnackbar.value = true
  } catch (error: any) {
    console.error('❌ Yoklama export hatası:', error)
    successMessage.value = 'Yoklama verileri indirilirken hata oluştu!'
    successSnackbar.value = true
  } finally {
    exportingAttendance.value = false
  }
}

// Lifecycle
onMounted(() => {
  fetchStudents()
  fetchGroups()
})
</script>